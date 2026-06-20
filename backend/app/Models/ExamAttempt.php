<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamAttempt extends Model
{
    protected $fillable = ['exam_id', 'user_id', 'attempt_number', 'started_at', 'submitted_at', 'score', 'status'];
    protected function casts(): array { return ['started_at' => 'datetime', 'submitted_at' => 'datetime', 'score' => 'decimal:2']; }
    public function exam(): BelongsTo { return $this->belongsTo(Exam::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function answers(): HasMany { return $this->hasMany(ExamAnswer::class, 'attempt_id'); }
}
