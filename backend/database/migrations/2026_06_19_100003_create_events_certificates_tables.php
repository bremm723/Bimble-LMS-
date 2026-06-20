<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->unsignedInteger('quota')->nullable();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->decimal('passing_grade', 5, 2)->nullable();
            $table->string('banner_image')->nullable();
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->boolean('gateway_enabled')->default(false);
            $table->timestamps();
        });

        // Add FK constraint for event_id in exams table (column already exists)
        Schema::table('exams', function (Blueprint $table) {
            $table->foreign('event_id')->references('id')->on('events')->nullOnDelete();
        });

        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('pending');
            $table->timestamps();
            $table->unique(['event_id', 'user_id']);
        });

        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('background_image');
            $table->json('placeholders')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('certificate_templates')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->string('code')->unique();
            $table->string('qr_code')->nullable();
            $table->timestamp('issued_at')->useCurrent();
            $table->json('data')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('certificate_templates');
        Schema::dropIfExists('event_registrations');
        Schema::table('exams', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
        });
        Schema::dropIfExists('events');
    }
};
