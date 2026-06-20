<?php

namespace App\Http\Controllers\Api;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\CourseEnrollment;
use App\Models\EventRegistration;
use App\Models\ExamAttempt;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificateController
{
    // --- Template CRUD (Admin) ---
    public function indexTemplates(Request $request): JsonResponse
    {
        $query = CertificateTemplate::with('branch')->latest();
        if ($request->has('branch_id')) $query->where('branch_id', $request->branch_id);
        return response()->json($query->paginate(20));
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'background_image' => 'required|string',
            'placeholders' => 'nullable|array',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $template = CertificateTemplate::create($data);
        return response()->json($template, 201);
    }

    public function showTemplate(CertificateTemplate $template): JsonResponse
    {
        return response()->json($template->load(['branch', 'certificates']));
    }

    public function updateTemplate(Request $request, CertificateTemplate $template): JsonResponse
    {
        $data = $request->validate([
            'name' => 'string|max:255',
            'background_image' => 'string',
            'placeholders' => 'nullable|array',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $template->update($data);
        return response()->json($template->fresh());
    }

    public function destroyTemplate(CertificateTemplate $template): JsonResponse
    {
        $template->delete();
        return response()->json(null, 204);
    }

    // --- Certificate Generation ---

    /**
     * Issue certificate for completing a course (100% materials).
     */
    public function issueForCourse(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'course_id' => 'required|exists:courses,id',
            'template_id' => 'required|exists:certificate_templates,id',
        ]);

        // Check if student completed all materials
        $enrollment = CourseEnrollment::where('user_id', $request->user_id)
            ->where('course_id', $request->course_id)
            ->first();

        if (!$enrollment || ($enrollment->progress_pct ?? 0) < 100) {
            return response()->json(['message' => 'Course not completed.'], 422);
        }

        // Check if certificate already issued
        $existing = Certificate::where('user_id', $request->user_id)
            ->where('course_id', $request->course_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Certificate already issued.', 'certificate' => $existing], 422);
        }

        $certificate = $this->createCertificate(
            $request->template_id,
            $request->user_id,
            null,
            $request->course_id,
            $request->all()
        );

        return response()->json($certificate, 201);
    }

    /**
     * Issue certificate for passing an event exam.
     */
    public function issueForEvent(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'event_id' => 'required|exists:events,id',
            'template_id' => 'required|exists:certificate_templates,id',
        ]);

        $event = \App\Models\Event::findOrFail($request->event_id);

        // Check if user is a confirmed participant
        $registration = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $request->user_id)
            ->where('status', 'confirmed')
            ->first();

        if (!$registration) {
            return response()->json(['message' => 'Not a confirmed participant.'], 422);
        }

        // Check passing grade if event has exam and passing grade
        if ($event->exam && $event->passing_grade) {
            $bestAttempt = ExamAttempt::where('exam_id', $event->exam->id)
                ->where('user_id', $request->user_id)
                ->where('status', 'graded')
                ->orderByDesc('score')
                ->first();

            if (!$bestAttempt) {
                return response()->json(['message' => 'No graded attempt found.'], 422);
            }

            // Calculate percentage
            $maxScore = $event->exam->questions()->sum('points');
            $percentage = $maxScore > 0 ? ($bestAttempt->score / $maxScore) * 100 : 0;

            if ($percentage < $event->passing_grade) {
                return response()->json(['message' => 'Did not meet passing grade.', 'score' => $percentage, 'required' => $event->passing_grade], 422);
            }
        }

        // Check duplicate
        $existing = Certificate::where('user_id', $request->user_id)
            ->where('event_id', $request->event_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Certificate already issued.', 'certificate' => $existing], 422);
        }

        $certificate = $this->createCertificate(
            $request->template_id,
            $request->user_id,
            $request->event_id,
            null,
            $request->all()
        );

        return response()->json($certificate, 201);
    }

    /**
     * Batch issue certificates for event participants who passed.
     */
    public function batchIssueForEvent(Request $request): JsonResponse
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'template_id' => 'required|exists:certificate_templates,id',
        ]);

        $event = \App\Models\Event::with('exam')->findOrFail($request->event_id);
        $participants = EventRegistration::where('event_id', $event->id)
            ->where('status', 'confirmed')
            ->with('user')
            ->get();

        $issued = [];
        foreach ($participants as $reg) {
            // Skip if already issued
            if (Certificate::where('user_id', $reg->user_id)->where('event_id', $event->id)->exists()) {
                continue;
            }

            // Check passing grade
            if ($event->exam && $event->passing_grade) {
                $bestAttempt = ExamAttempt::where('exam_id', $event->exam->id)
                    ->where('user_id', $reg->user_id)
                    ->where('status', 'graded')
                    ->orderByDesc('score')
                    ->first();

                if (!$bestAttempt) continue;

                $maxScore = $event->exam->questions()->sum('points');
                $percentage = $maxScore > 0 ? ($bestAttempt->score / $maxScore) * 100 : 0;

                if ($percentage < $event->passing_grade) continue;
            }

            $issued[] = $this->createCertificate(
                $request->template_id,
                $reg->user_id,
                $event->id,
                null,
                ['user_name' => $reg->user->name]
            );
        }

        return response()->json(['issued' => count($issued), 'certificates' => $issued], 201);
    }

    // --- Public Verification ---

    /**
     * Verify a certificate by its unique code (public endpoint).
     */
    public function verify(string $code): JsonResponse
    {
        $certificate = Certificate::where('code', $code)
            ->with(['user:id,name', 'event:id,title', 'course:id,title', 'template:id,name'])
            ->first();

        if (!$certificate) {
            return response()->json(['valid' => false, 'message' => 'Certificate not found.'], 404);
        }

        return response()->json([
            'valid' => true,
            'certificate' => [
                'code' => $certificate->code,
                'holder' => $certificate->user->name,
                'event' => $certificate->event?->title,
                'course' => $certificate->course?->title,
                'template' => $certificate->template->name,
                'issued_at' => $certificate->issued_at,
                'data' => $certificate->data,
            ],
        ]);
    }

    // --- Certificate History ---
    public function myCertificates(Request $request): JsonResponse
    {
        $certificates = Certificate::where('user_id', $request->user()->id)
            ->with(['event:id,title', 'course:id,title', 'template:id,name'])
            ->latest('issued_at')
            ->get();

        return response()->json($certificates);
    }

    public function indexCertificates(Request $request): JsonResponse
    {
        $query = Certificate::with(['user', 'event', 'course', 'template'])->latest('issued_at');
        if ($request->has('user_id')) $query->where('user_id', $request->user_id);
        if ($request->has('event_id')) $query->where('event_id', $request->event_id);
        if ($request->has('course_id')) $query->where('course_id', $request->course_id);
        return response()->json($query->paginate(20));
    }

    // --- Private Helpers ---
    private function createCertificate(int $templateId, int $userId, ?int $eventId, ?int $courseId, array $extraData = []): Certificate
    {
        $code = 'CERT-' . strtoupper(Str::random(6)) . '-' . now()->format('Ymd');

        return Certificate::create([
            'template_id' => $templateId,
            'user_id' => $userId,
            'event_id' => $eventId,
            'course_id' => $courseId,
            'code' => $code,
            'qr_code' => url("/verify/{$code}"),
            'issued_at' => now(),
            'data' => array_merge([
                'issued_date' => now()->toDateString(),
            ], $extraData),
        ])->tap(function ($cert) {
            AuditService::logCertificateIssued($cert->id, $cert->toArray());
        });
    }
}
