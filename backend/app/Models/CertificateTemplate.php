<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CertificateTemplate extends Model
{
    protected $fillable = ['name', 'background_image', 'placeholders', 'branch_id'];
    protected function casts(): array { return ['placeholders' => 'array']; }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function certificates(): HasMany { return $this->hasMany(Certificate::class, 'template_id'); }
}
