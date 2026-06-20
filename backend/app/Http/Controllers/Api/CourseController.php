<?php

namespace App\Http\Controllers\Api;

use App\Models\Course;
use App\Models\CourseEnrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::with(['tutor', 'branch'])->latest();

        // Branch scoping for admin_cabang
        if ($request->attributes->has('branch_scope_id')) {
            $query->where('branch_id', $request->attributes->get('branch_scope_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('subject')) {
            $query->where('subject', $request->subject);
        }
        if ($request->has('level')) {
            $query->where('level', $request->level);
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject' => 'required|string|max:100',
            'level' => 'required|string|max:20',
            'branch_id' => 'required|exists:branches,id',
            'tutor_id' => 'nullable|exists:users,id',
            'status' => 'in:draft,published,archived',
        ]);

        $course = Course::create($data);
        return response()->json($course, 201);
    }

    public function show(Course $course): JsonResponse
    {
        $course->load(['tutor', 'branch', 'chapters.materials']);
        return response()->json($course);
    }

    public function update(Request $request, Course $course): JsonResponse
    {
        $data = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'subject' => 'string|max:100',
            'level' => 'string|max:20',
            'tutor_id' => 'nullable|exists:users,id',
            'status' => 'in:draft,published,archived',
            'thumbnail' => 'nullable|string',
        ]);

        $course->update($data);
        return response()->json($course->fresh());
    }

    public function destroy(Course $course): JsonResponse
    {
        $course->delete();
        return response()->json(null, 204);
    }

    public function enroll(Request $request, Course $course): JsonResponse
    {
        $existing = CourseEnrollment::where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already enrolled.'], 422);
        }

        $enrollment = CourseEnrollment::create([
            'user_id' => $request->user()->id,
            'course_id' => $course->id,
        ]);

        return response()->json($enrollment, 201);
    }

    public function myCourses(Request $request): JsonResponse
    {
        $enrollments = CourseEnrollment::with('course.chapters.materials')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($enrollments);
    }
}
