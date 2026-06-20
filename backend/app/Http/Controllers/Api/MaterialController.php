<?php

namespace App\Http\Controllers\Api;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MaterialController
{
    public function storeChapter(Request $request, Course $course): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
        ]);

        $maxOrder = $course->chapters()->max('sort_order') ?? 0;
        $data['course_id'] = $course->id;
        $data['sort_order'] = $data['sort_order'] ?? $maxOrder + 1;

        $chapter = Chapter::create($data);
        return response()->json($chapter, 201);
    }

    public function updateChapter(Request $request, Chapter $chapter): JsonResponse
    {
        $data = $request->validate([
            'title' => 'string|max:255',
            'sort_order' => 'integer',
        ]);

        $chapter->update($data);
        return response()->json($chapter->fresh());
    }

    public function destroyChapter(Chapter $chapter): JsonResponse
    {
        $chapter->delete();
        return response()->json(null, 204);
    }

    public function reorderChapters(Request $request, Course $course): JsonResponse
    {
        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:chapters,id',
        ]);

        foreach ($request->order as $index => $chapterId) {
            Chapter::where('id', $chapterId)->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Chapters reordered.']);
    }

    public function storeMaterial(Request $request, Chapter $chapter): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:video,audio,text,image,link',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'embed_url' => 'nullable|url|max:500',
            'sort_order' => 'nullable|integer',
            'status' => 'in:draft,published',
            'scheduled_at' => 'nullable|date',
        ]);

        $maxOrder = $chapter->materials()->max('sort_order') ?? 0;
        $data['chapter_id'] = $chapter->id;
        $data['sort_order'] = $data['sort_order'] ?? $maxOrder + 1;

        $material = Material::create($data);
        return response()->json($material, 201);
    }

    public function updateMaterial(Request $request, Material $material): JsonResponse
    {
        $data = $request->validate([
            'type' => 'in:video,audio,text,image,link',
            'title' => 'string|max:255',
            'content' => 'nullable|string',
            'embed_url' => 'nullable|url|max:500',
            'sort_order' => 'nullable|integer',
            'status' => 'in:draft,published',
            'scheduled_at' => 'nullable|date',
        ]);

        $material->update($data);
        return response()->json($material->fresh());
    }

    public function destroyMaterial(Material $material): JsonResponse
    {
        $material->delete();
        return response()->json(null, 204);
    }

    public function markComplete(Request $request, Material $material): JsonResponse
    {
        $userId = $request->user()->id;

        DB::table('material_progress')->updateOrInsert(
            ['user_id' => $userId, 'material_id' => $material->id],
            ['completed' => true, 'completed_at' => now(), 'updated_at' => now()]
        );

        // Update course enrollment progress
        $course = $material->chapter->course;
        $totalMaterials = $course->chapters->sum(fn($ch) => $ch->materials->count());
        $completedMaterials = DB::table('material_progress')
            ->join('materials', 'material_progress.material_id', '=', 'materials.id')
            ->join('chapters', 'materials.chapter_id', '=', 'chapters.id')
            ->where('chapters.course_id', $course->id)
            ->where('material_progress.user_id', $userId)
            ->where('material_progress.completed', true)
            ->count();

        $progress = $totalMaterials > 0 ? ($completedMaterials / $totalMaterials) * 100 : 0;

        DB::table('course_enrollments')
            ->where('user_id', $userId)
            ->where('course_id', $course->id)
            ->update(['progress_pct' => $progress, 'updated_at' => now()]);

        return response()->json([
            'message' => 'Material marked as complete.',
            'progress_pct' => round($progress, 2),
        ]);
    }
}
