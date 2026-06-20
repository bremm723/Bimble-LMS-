<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseEnrollment extends Model
{
    protected $fillable = ['user_id', 'course_id', 'enrolled_at', 'progress_pct'];
    protected function casts(): array { return ['enrolled_at' => 'datetime', 'progress_pct' => 'decimal:2']; }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
}
