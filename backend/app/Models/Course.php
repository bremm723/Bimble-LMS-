<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'title', 'description', 'subject', 'level',
        'branch_id', 'tutor_id', 'status', 'thumbnail',
    ];

    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function tutor(): BelongsTo { return $this->belongsTo(User::class, 'tutor_id'); }
    public function chapters(): HasMany { return $this->hasMany(Chapter::class)->orderBy('sort_order'); }
    public function enrollments(): HasMany { return $this->hasMany(CourseEnrollment::class); }
}
