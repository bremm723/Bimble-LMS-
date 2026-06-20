<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_banks', function (Blueprint $table) {
            $table->id();
            $table->string('subject');
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
            $table->json('tags')->nullable();
            $table->timestamps();
        });

        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_id')->constrained('question_banks')->cascadeOnDelete();
            $table->enum('type', [
                'single_choice', 'multi_choice', 'true_false',
                'essay', 'matching', 'ordering', 'agree_disagree',
            ]);
            $table->text('content');
            $table->json('options')->nullable();
            $table->json('correct_answer')->nullable();
            $table->boolean('partial_scoring')->default(false);
            $table->unsignedInteger('points')->default(1);
            $table->text('explanation')->nullable();
            $table->timestamps();
        });

        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->unsignedBigInteger('event_id')->nullable();
            $table->unsignedInteger('duration_mins')->default(60);
            $table->unsignedInteger('max_attempts')->default(1);
            $table->boolean('shuffle_questions')->default(false);
            $table->boolean('shuffle_options')->default(false);
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->timestamps();
        });

        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('attempt_number')->default(1);
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('submitted_at')->nullable();
            $table->decimal('score', 8, 2)->nullable();
            $table->enum('status', ['in_progress', 'submitted', 'graded'])->default('in_progress');
            $table->timestamps();
        });

        Schema::create('exam_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attempt_id')->constrained('exam_attempts')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->json('answer')->nullable();
            $table->decimal('score', 8, 2)->nullable();
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_answers');
        Schema::dropIfExists('exam_attempts');
        Schema::dropIfExists('exam_questions');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('question_banks');
    }
};
