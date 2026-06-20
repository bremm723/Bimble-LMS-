<?php

namespace App\Http\Controllers\Api;

use App\Models\Exam;
use App\Models\ExamAnswer;
use App\Models\ExamAttempt;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController
{
    // --- Question Bank ---
    public function indexBanks(Request $request): JsonResponse
    {
        $query = QuestionBank::withCount('questions')->latest();
        if ($request->has('subject')) $query->where('subject', $request->subject);
        if ($request->has('difficulty')) $query->where('difficulty', $request->difficulty);
        return response()->json($query->paginate(20));
    }

    public function storeBank(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => 'required|string|max:100',
            'difficulty' => 'in:easy,medium,hard',
            'tags' => 'nullable|array',
        ]);
        $bank = QuestionBank::create($data);
        return response()->json($bank, 201);
    }

    public function storeQuestion(Request $request, QuestionBank $bank): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|in:single_choice,multi_choice,true_false,essay,matching,ordering,agree_disagree',
            'content' => 'required|string',
            'options' => 'nullable|array',
            'correct_answer' => 'nullable|array',
            'partial_scoring' => 'boolean',
            'points' => 'integer|min:1',
            'explanation' => 'nullable|string',
        ]);

        $data['bank_id'] = $bank->id;
        $question = Question::create($data);
        return response()->json($question, 201);
    }

    public function updateQuestion(Request $request, Question $question): JsonResponse
    {
        $data = $request->validate([
            'type' => 'in:single_choice,multi_choice,true_false,essay,matching,ordering,agree_disagree',
            'content' => 'string',
            'options' => 'nullable|array',
            'correct_answer' => 'nullable|array',
            'partial_scoring' => 'boolean',
            'points' => 'integer|min:1',
            'explanation' => 'nullable|string',
        ]);

        $question->update($data);
        return response()->json($question->fresh());
    }

    public function destroyQuestion(Question $question): JsonResponse
    {
        $question->delete();
        return response()->json(null, 204);
    }

    // --- Exams ---
    public function indexExams(Request $request): JsonResponse
    {
        $query = Exam::with('course')->latest();
        if ($request->has('status')) $query->where('status', $request->status);
        if ($request->has('course_id')) $query->where('course_id', $request->course_id);
        return response()->json($query->paginate(20));
    }

    public function storeExam(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'course_id' => 'nullable|exists:courses,id',
            'event_id' => 'nullable|exists:events,id',
            'duration_mins' => 'integer|min:1',
            'max_attempts' => 'integer|min:1',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after:start_at',
            'status' => 'in:draft,published,closed',
            'question_ids' => 'nullable|array',
            'question_ids.*' => 'exists:questions,id',
        ]);

        $questionIds = $data['question_ids'] ?? [];
        unset($data['question_ids']);

        $exam = Exam::create($data);

        // Attach questions
        foreach ($questionIds as $index => $qId) {
            $exam->questions()->attach($qId, ['sort_order' => $index]);
        }

        return response()->json($exam->load('questions'), 201);
    }

    public function showExam(Exam $exam): JsonResponse
    {
        $exam->load(['questions', 'course']);
        return response()->json($exam);
    }

    public function updateExam(Request $request, Exam $exam): JsonResponse
    {
        $data = $request->validate([
            'title' => 'string|max:255',
            'duration_mins' => 'integer|min:1',
            'max_attempts' => 'integer|min:1',
            'shuffle_questions' => 'boolean',
            'shuffle_options' => 'boolean',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date',
            'status' => 'in:draft,published,closed',
        ]);

        $exam->update($data);
        return response()->json($exam->fresh());
    }

    // --- Exam Taking (Student) ---
    public function startAttempt(Request $request, Exam $exam): JsonResponse
    {
        $user = $request->user();

        // Check time window
        if ($exam->start_at && now()->lt($exam->start_at)) {
            return response()->json(['message' => 'Exam has not started yet.'], 422);
        }
        if ($exam->end_at && now()->gt($exam->end_at)) {
            return response()->json(['message' => 'Exam has ended.'], 422);
        }

        // Check max attempts
        $attemptCount = $exam->attempts()->where('user_id', $user->id)->count();
        if ($attemptCount >= $exam->max_attempts) {
            return response()->json(['message' => 'Maximum attempts reached.'], 422);
        }

        $attempt = ExamAttempt::create([
            'exam_id' => $exam->id,
            'user_id' => $user->id,
            'attempt_number' => $attemptCount + 1,
        ]);

        return response()->json($attempt->load('exam.questions'), 201);
    }

    public function submitAttempt(Request $request, ExamAttempt $attempt): JsonResponse
    {
        if ($attempt->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }
        if ($attempt->status !== 'in_progress') {
            return response()->json(['message' => 'Already submitted.'], 422);
        }

        $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.answer' => 'nullable',
        ]);

        $totalScore = 0;
        $maxScore = 0;

        DB::transaction(function () use ($request, $attempt, &$totalScore, &$maxScore) {
            foreach ($request->answers as $ans) {
                $question = Question::find($ans['question_id']);
                $maxScore += $question->points;

                $score = null;
                // Auto-grade objective questions
                if ($question->type !== 'essay') {
                    $score = $this->gradeQuestion($question, $ans['answer'] ?? null);
                    $totalScore += $score;
                }

                ExamAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'answer' => $ans['answer'],
                    'score' => $score,
                ]);
            }

            $hasEssays = $attempt->answers()->whereNull('score')
                ->whereHas('question', fn($q) => $q->where('type', 'essay'))
                ->exists();

            $attempt->update([
                'submitted_at' => now(),
                'score' => $hasEssays ? null : $totalScore,
                'status' => $hasEssays ? 'submitted' : 'graded',
            ]);
        });

        return response()->json($attempt->fresh()->load('answers.question'));
    }

    // --- Essay Grading (Tutor) ---
    public function gradeEssay(Request $request, ExamAnswer $answer): JsonResponse
    {
        $request->validate([
            'score' => 'required|numeric|min:0',
        ]);

        $answer->update([
            'score' => $request->score,
            'graded_by' => $request->user()->id,
            'graded_at' => now(),
        ]);

        AuditService::logGrade($answer->id, $request->score);

        // Recalculate attempt score
        $attempt = $answer->attempt;
        $totalScore = $attempt->answers()->sum('score');
        $allGraded = $attempt->answers()->whereNull('score')->count() === 0;

        if ($allGraded) {
            $attempt->update(['score' => $totalScore, 'status' => 'graded']);
        }

        return response()->json($answer->fresh());
    }

    public function getAttempts(Request $request, Exam $exam): JsonResponse
    {
        $attempts = $exam->attempts()
            ->where('user_id', $request->user()->id)
            ->with('answers.question')
            ->latest()
            ->get();

        return response()->json($attempts);
    }

    // --- Auto-Grading Logic ---
    private function gradeQuestion(Question $question, mixed $answer): float
    {
        if (is_null($answer)) return 0;

        $correct = $question->correct_answer;

        return match ($question->type) {
            'single_choice' => ($answer === ($correct['value'] ?? null)) ? $question->points : 0,
            'true_false' => ($answer === ($correct['value'] ?? null)) ? $question->points : 0,
            'multi_choice' => $this->gradeMultiChoice($correct['values'] ?? [], (array)$answer, $question),
            'matching' => $this->gradeMatching($correct['pairs'] ?? [], (array)$answer, $question),
            'ordering' => $this->gradeOrdering($correct['order'] ?? [], (array)$answer, $question),
            'agree_disagree' => ($answer === ($correct['value'] ?? null)) ? $question->points : 0,
            default => 0,
        };
    }

    private function gradeMultiChoice(array $correct, array $given, Question $question): float
    {
        sort($correct);
        sort($given);
        if ($correct === $given) return $question->points;

        if ($question->partial_scoring) {
            $matches = count(array_intersect($correct, $given));
            $total = count($correct);
            return $total > 0 ? round(($matches / $total) * $question->points, 2) : 0;
        }

        return 0;
    }

    private function gradeMatching(array $pairs, array $given, Question $question): float
    {
        $correct = 0;
        $total = count($pairs);
        foreach ($pairs as $left => $right) {
            if (($given[$left] ?? null) === $right) $correct++;
        }

        if ($question->partial_scoring && $total > 0) {
            return round(($correct / $total) * $question->points, 2);
        }
        return ($correct === $total) ? $question->points : 0;
    }

    private function gradeOrdering(array $correctOrder, array $givenOrder, Question $question): float
    {
        if ($correctOrder === $givenOrder) return $question->points;

        if ($question->partial_scoring) {
            $correct = 0;
            foreach ($correctOrder as $i => $item) {
                if (($givenOrder[$i] ?? null) === $item) $correct++;
            }
            $total = count($correctOrder);
            return $total > 0 ? round(($correct / $total) * $question->points, 2) : 0;
        }

        return 0;
    }
}
