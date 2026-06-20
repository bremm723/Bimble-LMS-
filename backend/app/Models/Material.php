<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Material extends Model
{
    protected $fillable = ['chapter_id', 'type', 'title', 'content', 'embed_url', 'sort_order', 'status', 'scheduled_at'];
    protected function casts(): array { return ['scheduled_at' => 'datetime']; }
    public function chapter(): BelongsTo { return $this->belongsTo(Chapter::class); }
}
