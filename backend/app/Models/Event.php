<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = ['title', 'description', 'price', 'quota', 'start_at', 'end_at', 'branch_id', 'passing_grade', 'banner_image', 'status', 'gateway_enabled'];
    protected function casts(): array { return ['start_at' => 'datetime', 'end_at' => 'datetime', 'price' => 'decimal:2', 'passing_grade' => 'decimal:2', 'gateway_enabled' => 'boolean']; }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function registrations(): HasMany { return $this->hasMany(EventRegistration::class); }
    public function exam() { return $this->hasOne(Exam::class); }
}
