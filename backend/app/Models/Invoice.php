<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = ['user_id', 'scheme_id', 'amount', 'due_date', 'status', 'paid_at', 'invoice_number'];
    protected function casts(): array { return ['due_date' => 'date', 'paid_at' => 'datetime', 'amount' => 'decimal:2']; }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function scheme(): BelongsTo { return $this->belongsTo(PaymentScheme::class, 'scheme_id'); }
    public function payments(): HasMany { return $this->hasMany(Payment::class); }
}
