<?php

namespace App\Http\Controllers\Api;

use App\Models\Expense;
use App\Models\Income;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentScheme;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FinanceController
{
    // --- Payment Schemes ---
    public function indexSchemes(Request $request): JsonResponse
    {
        $query = PaymentScheme::with('branch')->latest();
        if ($branchId = $request->header('X-Branch-Id')) {
            $query->where('branch_id', $branchId);
        }
        return response()->json($query->paginate(20));
    }

    public function storeScheme(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:monthly,package,once',
            'amount' => 'required|numeric|min:0',
            'meeting_count' => 'nullable|integer|min:1',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $scheme = PaymentScheme::create($data);
        return response()->json($scheme, 201);
    }

    public function updateScheme(Request $request, PaymentScheme $scheme): JsonResponse
    {
        $data = $request->validate([
            'name' => 'string|max:255',
            'type' => 'in:monthly,package,once',
            'amount' => 'numeric|min:0',
            'meeting_count' => 'nullable|integer|min:1',
        ]);

        $scheme->update($data);
        return response()->json($scheme->fresh());
    }

    public function destroyScheme(PaymentScheme $scheme): JsonResponse
    {
        $scheme->delete();
        return response()->json(null, 204);
    }

    // --- Invoices ---
    public function indexInvoices(Request $request): JsonResponse
    {
        $query = Invoice::with(['user', 'scheme', 'payments'])->latest();

        if ($request->has('status')) $query->where('status', $request->status);
        if ($request->has('user_id')) $query->where('user_id', $request->user_id);

        return response()->json($query->paginate(20));
    }

    public function storeInvoice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'scheme_id' => 'nullable|exists:payment_schemes,id',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
        ]);

        $data['invoice_number'] = 'INV-' . strtoupper(Str::random(8)) . '-' . now()->format('Ymd');
        $data['status'] = 'unpaid';

        $invoice = Invoice::create($data);
        AuditService::logInvoiceCreated($invoice->id, $data);
        return response()->json($invoice, 201);
    }

    public function showInvoice(Invoice $invoice): JsonResponse
    {
        return response()->json($invoice->load(['user', 'scheme', 'payments']));
    }

    public function updateInvoice(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'amount' => 'numeric|min:0',
            'due_date' => 'date',
            'status' => 'in:unpaid,paid,overdue',
        ]);

        $invoice->update($data);
        return response()->json($invoice->fresh());
    }

    /**
     * Generate invoices for all active students under a scheme.
     * Typically called monthly via cron or manually by admin.
     */
    public function generateInvoices(Request $request): JsonResponse
    {
        $request->validate([
            'scheme_id' => 'required|exists:payment_schemes,id',
            'due_date' => 'required|date',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $scheme = PaymentScheme::findOrFail($request->scheme_id);
        $userIds = $request->user_ids ?? \App\Models\User::where('role', 'siswa')
            ->where('status', 'active')
            ->pluck('id')
            ->toArray();

        $created = [];
        foreach ($userIds as $userId) {
            // Skip if invoice already exists for this user+scheme+month
            $exists = Invoice::where('user_id', $userId)
                ->where('scheme_id', $scheme->id)
                ->whereMonth('due_date', now()->month)
                ->whereYear('due_date', now()->year)
                ->exists();

            if ($exists) continue;

            $created[] = Invoice::create([
                'user_id' => $userId,
                'scheme_id' => $scheme->id,
                'amount' => $scheme->amount,
                'due_date' => $request->due_date,
                'invoice_number' => 'INV-' . strtoupper(Str::random(8)) . '-' . now()->format('Ymd'),
                'status' => 'unpaid',
            ]);
        }

        return response()->json(['generated' => count($created), 'invoices' => $created], 201);
    }

    // --- Payments ---
    public function storePayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'method' => 'in:gateway,manual',
            'proof_image' => 'nullable|string',
            'transaction_ref' => 'nullable|string|unique:payments',
            'notes' => 'nullable|string',
        ]);

        $data['verification_status'] = 'pending';

        $payment = Payment::create($data);
        AuditService::logPayment($payment->id, null, $data);
        return response()->json($payment, 201);
    }

    /**
     * Admin verifies a manual payment and marks invoice as paid.
     */
    public function verifyPayment(Request $request, Payment $payment): JsonResponse
    {
        $request->validate([
            'action' => 'required|in:verify,reject',
        ]);

        $isVerified = $request->action === 'verify';

        $payment->update([
            'verification_status' => $isVerified ? 'verified' : 'rejected',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        if ($isVerified) {
            $invoice = $payment->invoice;
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Auto-create income record
            $branchId = $invoice->user->branch_id;
            if ($branchId) {
                $income = Income::create([
                    'branch_id' => $branchId,
                    'description' => 'Payment for ' . $invoice->invoice_number,
                    'amount' => $payment->amount,
                    'category' => 'tuition',
                    'date' => now()->toDateString(),
                    'payment_id' => $payment->id,
                    'created_by' => $request->user()->id,
                ]);
                AuditService::logIncomeCreated($income->id, ['from_payment' => $payment->id]);
            }
        }

        AuditService::logPayment($payment->id, null, ['verification_status' => $isVerified ? 'verified' : 'rejected']);

        return response()->json($payment->fresh()->load('invoice'));
    }

    public function indexPayments(Request $request): JsonResponse
    {
        $query = Payment::with(['invoice.user', 'verifier'])->latest();
        if ($request->has('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }
        return response()->json($query->paginate(20));
    }

    // --- Income / Expense ---
    public function indexIncomes(Request $request): JsonResponse
    {
        $query = Income::with(['branch', 'creator'])->latest('date');
        if ($request->has('branch_id')) $query->where('branch_id', $request->branch_id);
        if ($request->has('from')) $query->where('date', '>=', $request->from);
        if ($request->has('to')) $query->where('date', '<=', $request->to);
        return response()->json($query->paginate(20));
    }

    public function storeIncome(Request $request): JsonResponse
    {
        $data = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'date' => 'required|date',
        ]);

        $data['created_by'] = $request->user()->id;
        $income = Income::create($data);
        AuditService::logIncomeCreated($income->id, $data);
        return response()->json($income, 201);
    }

    public function indexExpenses(Request $request): JsonResponse
    {
        $query = Expense::with(['branch', 'creator'])->latest('date');
        if ($request->has('branch_id')) $query->where('branch_id', $request->branch_id);
        if ($request->has('from')) $query->where('date', '>=', $request->from);
        if ($request->has('to')) $query->where('date', '<=', $request->to);
        return response()->json($query->paginate(20));
    }

    public function storeExpense(Request $request): JsonResponse
    {
        $data = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'date' => 'required|date',
        ]);

        $data['created_by'] = $request->user()->id;
        $expense = Expense::create($data);
        AuditService::logExpenseCreated($expense->id, $data);
        return response()->json($expense, 201);
    }

    // --- Reports ---
    /**
     * Profit/Loss report for a given period.
     */
    public function profitLossReport(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'required|date',
            'to' => 'required|date|after_or_equal:from',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        $branchId = $request->branch_id;

        $incomeQuery = Income::whereBetween('date', [$request->from, $request->to]);
        $expenseQuery = Expense::whereBetween('date', [$request->from, $request->to]);

        if ($branchId) {
            $incomeQuery->where('branch_id', $branchId);
            $expenseQuery->where('branch_id', $branchId);
        }

        $totalIncome = (clone $incomeQuery)->sum('amount');
        $totalExpense = (clone $expenseQuery)->sum('amount');

        // Group by category
        $incomeByCategory = (clone $incomeQuery)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        $expenseByCategory = (clone $expenseQuery)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        return response()->json([
            'period' => ['from' => $request->from, 'to' => $request->to],
            'branch_id' => $branchId,
            'total_income' => $totalIncome,
            'total_expense' => $totalExpense,
            'net_profit' => $totalIncome - $totalExpense,
            'income_by_category' => $incomeByCategory,
            'expense_by_category' => $expenseByCategory,
        ]);
    }

    /**
     * Dashboard summary: overdue invoices, outstanding amounts, recent activity.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $branchId = $request->header('X-Branch-Id');

        $invoiceQuery = Invoice::query();
        if ($branchId) {
            $invoiceQuery->whereHas('user', fn($q) => $q->where('branch_id', $branchId));
        }

        $overdueCount = (clone $invoiceQuery)->where('status', 'overdue')->count();
        $overdueAmount = (clone $invoiceQuery)->where('status', 'overdue')->sum('amount');
        $unpaidCount = (clone $invoiceQuery)->where('status', 'unpaid')->count();
        $unpaidAmount = (clone $invoiceQuery)->where('status', 'unpaid')->sum('amount');
        $paidThisMonth = (clone $invoiceQuery)
            ->where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount');

        $recentOverdue = (clone $invoiceQuery)
            ->where('status', 'overdue')
            ->with('user')
            ->latest()
            ->limit(10)
            ->get();

        $pendingVerifications = Payment::where('verification_status', 'pending')
            ->with('invoice.user')
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'overdue' => ['count' => $overdueCount, 'amount' => $overdueAmount],
            'unpaid' => ['count' => $unpaidCount, 'amount' => $unpaidAmount],
            'paid_this_month' => $paidThisMonth,
            'recent_overdue' => $recentOverdue,
            'pending_verifications' => $pendingVerifications,
        ]);
    }
    /**
     * Student: list my own invoices.
     */
    public function myInvoices(Request $request): JsonResponse
    {
        $invoices = Invoice::with(['scheme', 'payments'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($invoices);
    }
}
