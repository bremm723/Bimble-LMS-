<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    protected $fillable = ['title', 'course_id', 'event_id', 'duration_mins', 'max_attempts', 'shuffle_questions', 'shuffle_options', 'start_at', 'end_at', 'status'];
    protected function casts(): array { return ['start_at' => 'datetime', 'end_at' => 'datetime', 'shuffle_questions' => 'boolean', 'shuffle_options' => 'boolean']; }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
    public function event(): BelongsTo { return $this->belongsTo(Event::class); }
    public function questions() { return $this->belongsToMany(Question::class, 'exam_questions')->withPivot('sort_order')->orderByPivot('sort_order'); }
    public function attempts(): HasMany { return $this->hasMany(ExamAttempt::class); }
}
