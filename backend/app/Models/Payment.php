<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = ['invoice_id', 'amount', 'method', 'proof_image', 'verification_status', 'verified_by', 'verified_at', 'transaction_ref', 'notes'];
    protected function casts(): array { return ['amount' => 'decimal:2', 'verified_at' => 'datetime']; }
    public function invoice(): BelongsTo { return $this->belongsTo(Invoice::class); }
    public function verifier(): BelongsTo { return $this->belongsTo(User::class, 'verified_by'); }
}
