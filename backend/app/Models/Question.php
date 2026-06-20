<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    protected $fillable = ['bank_id', 'type', 'content', 'options', 'correct_answer', 'partial_scoring', 'points', 'explanation'];
    protected function casts(): array { return ['options' => 'array', 'correct_answer' => 'array', 'partial_scoring' => 'boolean']; }
    public function bank(): BelongsTo { return $this->belongsTo(QuestionBank::class, 'bank_id'); }
}
