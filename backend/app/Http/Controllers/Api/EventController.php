<?php

namespace App\Http\Controllers\Api;

use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\ExamAttempt;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EventController
{
    // --- Event CRUD (Admin) ---
    public function index(Request $request): JsonResponse
    {
        $query = Event::with(['branch', 'registrations'])->latest();
        if ($request->has('status')) $query->where('status', $request->status);
        if ($request->has('branch_id')) $query->where('branch_id', $request->branch_id);
        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'numeric|min:0',
            'quota' => 'nullable|integer|min:1',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after:start_at',
            'branch_id' => 'required|exists:branches,id',
            'passing_grade' => 'nullable|numeric|min:0|max:100',
            'banner_image' => 'nullable|string',
            'status' => 'in:draft,published,closed',
            'gateway_enabled' => 'boolean',
        ]);

        $event = Event::create($data);
        return response()->json($event, 201);
    }

    public function show(Event $event): JsonResponse
    {
        $event->load(['branch', 'registrations.user', 'exam']);

        // Add registration count
        $event->registration_count = $event->registrations->where('status', 'confirmed')->count();
        $event->quota_remaining = $event->quota
            ? max(0, $event->quota - $event->registration_count)
            : null;

        return response()->json($event);
    }

    public function update(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'price' => 'numeric|min:0',
            'quota' => 'nullable|integer|min:1',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date',
            'passing_grade' => 'nullable|numeric|min:0|max:100',
            'banner_image' => 'nullable|string',
            'status' => 'in:draft,published,closed',
            'gateway_enabled' => 'boolean',
        ]);

        $event->update($data);
        return response()->json($event->fresh());
    }

    public function destroy(Event $event): JsonResponse
    {
        $event->delete();
        return response()->json(null, 204);
    }

    // --- Public event listing (no auth needed) ---
    public function publicIndex(Request $request): JsonResponse
    {
        $events = Event::where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('end_at')->orWhere('end_at', '>', now());
            })
            ->withCount(['registrations as registration_count' => function ($q) {
                $q->where('status', 'confirmed');
            }])
            ->latest('start_at')
            ->paginate(20);

        return response()->json($events);
    }

    public function publicShow(Event $event): JsonResponse
    {
        $event->load('branch');
        $confirmedCount = $event->registrations()->where('status', 'confirmed')->count();
        $event->registration_count = $confirmedCount;
        $event->quota_remaining = $event->quota ? max(0, $event->quota - $confirmedCount) : null;

        // Countdown
        if ($event->start_at && $event->start_at->isFuture()) {
            $event->countdown = [
                'days' => now()->diffInDays($event->start_at, false),
                'hours' => now()->diffInHours($event->start_at, false) % 24,
                'minutes' => now()->diffInMinutes($event->start_at, false) % 60,
            ];
        }

        return response()->json($event);
    }

    // --- Registration ---
    public function register(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();

        // Check quota
        $confirmedCount = $event->registrations()->where('status', 'confirmed')->count();
        if ($event->quota && $confirmedCount >= $event->quota) {
            return response()->json(['message' => 'Event quota is full.'], 422);
        }

        // Check duplicate
        $existing = EventRegistration::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing && $existing->status !== 'cancelled') {
            return response()->json(['message' => 'Already registered.', 'registration' => $existing], 422);
        }

        // Free event → auto confirm
        if ($event->price <= 0) {
            $reg = EventRegistration::updateOrCreate(
                ['event_id' => $event->id, 'user_id' => $user->id],
                ['status' => 'confirmed']
            );
            return response()->json($reg, 201);
        }

        // Paid event → create pending registration + invoice
        $reg = DB::transaction(function () use ($event, $user) {
            $reg = EventRegistration::updateOrCreate(
                ['event_id' => $event->id, 'user_id' => $user->id],
                ['status' => 'pending']
            );

            // Create invoice for event payment
            Invoice::create([
                'user_id' => $user->id,
                'amount' => $event->price,
                'due_date' => $event->start_at ?? now()->addDays(7),
                'invoice_number' => 'EVT-' . strtoupper(Str::random(6)) . '-' . now()->format('Ymd'),
                'status' => 'unpaid',
            ]);

            return $reg;
        });

        return response()->json($reg->load('event'), 201);
    }

    /**
     * Admin confirms a registration (after manual payment verification).
     */
    public function confirmRegistration(Request $request, EventRegistration $registration): JsonResponse
    {
        $registration->update(['status' => 'confirmed']);
        return response()->json($registration->fresh());
    }

    public function cancelRegistration(Request $request, EventRegistration $registration): JsonResponse
    {
        $registration->update(['status' => 'cancelled']);
        return response()->json($registration->fresh());
    }

    public function participants(Event $event): JsonResponse
    {
        $participants = $event->registrations()
            ->where('status', 'confirmed')
            ->with('user')
            ->paginate(20);

        return response()->json($participants);
    }

    // --- Leaderboard ---
    public function leaderboard(Event $event): JsonResponse
    {
        // Get exam linked to this event
        $exam = $event->exam;
        if (!$exam) {
            return response()->json(['message' => 'No exam linked to this event.'], 404);
        }

        $leaderboard = ExamAttempt::where('exam_id', $exam->id)
            ->where('status', 'graded')
            ->with('user:id,name,avatar')
            ->orderByDesc('score')
            ->orderByAsc('submitted_at')
            ->limit(50)
            ->get()
            ->map(function ($attempt, $index) {
                return [
                    'rank' => $index + 1,
                    'name' => $attempt->user->name,
                    'avatar' => $attempt->user->avatar,
                    'score' => $attempt->score,
                    'submitted_at' => $attempt->submitted_at,
                ];
            });

        return response()->json($leaderboard);
    }
}
