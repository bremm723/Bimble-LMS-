<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('subject');
            $table->string('level'); // SD, SMP, SMA
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('tutor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->string('thumbnail')->nullable();
            $table->timestamps();
        });

        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->timestamp('enrolled_at')->useCurrent();
            $table->decimal('progress_pct', 5, 2)->default(0);
            $table->timestamps();
            $table->unique(['user_id', 'course_id']);
        });

        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained('chapters')->cascadeOnDelete();
            $table->enum('type', ['video', 'audio', 'text', 'image', 'link']);
            $table->string('title');
            $table->longText('content')->nullable();
            $table->string('embed_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('material_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials')->cascadeOnDelete();
            $table->boolean('completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'material_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_progress');
        Schema::dropIfExists('materials');
        Schema::dropIfExists('chapters');
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('courses');
    }
};
