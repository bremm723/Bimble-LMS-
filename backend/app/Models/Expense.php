<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    protected $fillable = ['branch_id', 'description', 'amount', 'category', 'date', 'created_by'];
    protected function casts(): array { return ['amount' => 'decimal:2', 'date' => 'date']; }
    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
