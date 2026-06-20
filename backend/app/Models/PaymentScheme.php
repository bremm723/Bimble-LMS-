<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentScheme extends Model
{
    protected $fillable = ['name', 'type', 'amount', 'meeting_count', 'branch_id'];
    protected function casts(): array { return ['amount' => 'decimal:2']; }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function invoices(): HasMany { return $this->hasMany(Invoice::class, 'scheme_id'); }
}
