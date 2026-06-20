<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    protected $fillable = ['template_id', 'user_id', 'event_id', 'course_id', 'code', 'qr_code', 'issued_at', 'data'];
    protected function casts(): array { return ['issued_at' => 'datetime', 'data' => 'array']; }
    public function template(): BelongsTo { return $this->belongsTo(CertificateTemplate::class, 'template_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function event(): BelongsTo { return $this->belongsTo(Event::class); }
    public function course(): BelongsTo { return $this->belongsTo(Course::class); }
}
