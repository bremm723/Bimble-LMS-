<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_schemes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['monthly', 'package', 'once']);
            $table->decimal('amount', 12, 2);
            $table->unsignedInteger('meeting_count')->nullable();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('scheme_id')->nullable()->constrained('payment_schemes')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->date('due_date');
            $table->enum('status', ['unpaid', 'paid', 'overdue'])->default('unpaid');
            $table->timestamp('paid_at')->nullable();
            $table->string('invoice_number')->unique();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->enum('method', ['gateway', 'manual'])->default('manual');
            $table->string('proof_image')->nullable();
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->string('transaction_ref')->nullable()->unique();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('incomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->string('category')->nullable();
            $table->date('date');
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('description');
            $table->decimal('amount', 12, 2);
            $table->string('category')->nullable();
            $table->date('date');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('incomes');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('payment_schemes');
    }
};
