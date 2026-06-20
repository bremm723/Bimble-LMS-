<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamAnswer extends Model
{
    protected $fillable = ['attempt_id', 'question_id', 'answer', 'score', 'graded_by', 'graded_at'];
    protected function casts(): array { return ['answer' => 'array', 'score' => 'decimal:2', 'graded_at' => 'datetime']; }
    public function attempt(): BelongsTo { return $this->belongsTo(ExamAttempt::class, 'attempt_id'); }
    public function question(): BelongsTo { return $this->belongsTo(Question::class); }
    public function grader(): BelongsTo { return $this->belongsTo(User::class, 'graded_by'); }
}
