<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Log an action for audit trail.
     */
    public static function log(string $action, string $entityType, int $entityId, ?array $oldValues = null, ?array $newValues = null): void
    {
        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
        ]);
    }

    // Convenience methods for common actions

    public static function logPayment(int $paymentId, ?array $old = null, ?array $new = null): void
    {
        static::log('payment_update', 'App\\Models\\Payment', $paymentId, $old, $new);
    }

    public static function logGrade(int $answerId, ?float $score): void
    {
        static::log('essay_graded', 'App\\Models\\ExamAnswer', $answerId, null, ['score' => $score]);
    }

    public static function logInvoiceCreated(int $invoiceId, array $data): void
    {
        static::log('invoice_created', 'App\\Models\\Invoice', $invoiceId, null, $data);
    }

    public static function logCertificateIssued(int $certificateId, array $data): void
    {
        static::log('certificate_issued', 'App\\Models\\Certificate', $certificateId, null, $data);
    }

    public static function logExpenseCreated(int $expenseId, array $data): void
    {
        static::log('expense_created', 'App\\Models\\Expense', $expenseId, null, $data);
    }

    public static function logIncomeCreated(int $incomeId, array $data): void
    {
        static::log('income_created', 'App\\Models\\Income', $incomeId, null, $data);
    }
}
