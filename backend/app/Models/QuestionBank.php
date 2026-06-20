<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionBank extends Model
{
    protected $fillable = ['subject', 'difficulty', 'tags'];
    protected function casts(): array { return ['tags' => 'array']; }
    public function questions(): HasMany { return $this->hasMany(Question::class, 'bank_id'); }
}
