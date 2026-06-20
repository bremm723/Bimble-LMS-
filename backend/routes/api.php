<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\MidtransController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Public event pages
Route::get('/events', [EventController::class, 'publicIndex']);
Route::get('/events/{event}', [EventController::class, 'publicShow']);
Route::get('/events/{event}/leaderboard', [EventController::class, 'leaderboard']);

// Midtrans webhook (no auth, called by Midtrans server)
Route::post('/midtrans/webhook', [MidtransController::class, 'webhook']);
Route::get('/midtrans/config', [MidtransController::class, 'config']);

// Public certificate verification
Route::get('/verify/{code}', [CertificateController::class, 'verify']);

// CSRF cookie for Sanctum SPA auth
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['csrf_token' => csrf_token()]);
});

// Authenticated routes
Route::middleware(['auth:sanctum', 'branch.scope'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // LMS Routes
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/my', [CourseController::class, 'myCourses']);
    Route::get('/courses/{course}', [CourseController::class, 'show']);

    // Admin/Tutor routes
    Route::middleware('role:super_admin,admin_cabang,tutor')->group(function () {
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{course}', [CourseController::class, 'update']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);

        // Chapters
        Route::post('/courses/{course}/chapters', [MaterialController::class, 'storeChapter']);
        Route::put('/chapters/{chapter}', [MaterialController::class, 'updateChapter']);
        Route::delete('/chapters/{chapter}', [MaterialController::class, 'destroyChapter']);
        Route::put('/courses/{course}/chapters/reorder', [MaterialController::class, 'reorderChapters']);

        // Materials
        Route::post('/chapters/{chapter}/materials', [MaterialController::class, 'storeMaterial']);
        Route::put('/materials/{material}', [MaterialController::class, 'updateMaterial']);
        Route::delete('/materials/{material}', [MaterialController::class, 'destroyMaterial']);
    });

    // Student routes
    Route::middleware('role:siswa,tutor,admin_cabang,super_admin')->group(function () {
        Route::post('/courses/{course}/enroll', [CourseController::class, 'enroll']);
        Route::post('/materials/{material}/complete', [MaterialController::class, 'markComplete']);
    });

    // --- Exam Routes ---
    // Admin/Tutor exam management
    Route::middleware('role:super_admin,admin_cabang,tutor')->group(function () {
        // Question banks
        Route::get('/question-banks', [ExamController::class, 'indexBanks']);
        Route::post('/question-banks', [ExamController::class, 'storeBank']);
        Route::post('/question-banks/{bank}/questions', [ExamController::class, 'storeQuestion']);
        Route::put('/questions/{question}', [ExamController::class, 'updateQuestion']);
        Route::delete('/questions/{question}', [ExamController::class, 'destroyQuestion']);

        // Exams
        Route::get('/exams', [ExamController::class, 'indexExams']);
        Route::post('/exams', [ExamController::class, 'storeExam']);
        Route::get('/exams/{exam}', [ExamController::class, 'showExam']);
        Route::put('/exams/{exam}', [ExamController::class, 'updateExam']);

        // Essay grading
        Route::post('/exam-answers/{answer}/grade', [ExamController::class, 'gradeEssay']);
    });

    // Student exam taking
    Route::middleware('role:siswa,tutor,admin_cabang,super_admin')->group(function () {
        Route::post('/exams/{exam}/start', [ExamController::class, 'startAttempt']);
        Route::post('/exam-attempts/{attempt}/submit', [ExamController::class, 'submitAttempt']);
        Route::get('/exams/{exam}/attempts', [ExamController::class, 'getAttempts']);
    });

    // --- Finance Routes ---
    // Admin/Finance management
    Route::middleware('role:super_admin,admin_cabang')->group(function () {
        // Payment schemes
        Route::get('/payment-schemes', [FinanceController::class, 'indexSchemes']);
        Route::post('/payment-schemes', [FinanceController::class, 'storeScheme']);
        Route::put('/payment-schemes/{scheme}', [FinanceController::class, 'updateScheme']);
        Route::delete('/payment-schemes/{scheme}', [FinanceController::class, 'destroyScheme']);

        // Invoices
        Route::get('/invoices', [FinanceController::class, 'indexInvoices']);
        Route::post('/invoices', [FinanceController::class, 'storeInvoice']);
        Route::get('/invoices/{invoice}', [FinanceController::class, 'showInvoice']);
        Route::put('/invoices/{invoice}', [FinanceController::class, 'updateInvoice']);
        Route::post('/invoices/generate', [FinanceController::class, 'generateInvoices']);

        // Payments
        Route::get('/payments', [FinanceController::class, 'indexPayments']);
        Route::post('/payments', [FinanceController::class, 'storePayment']);
        Route::post('/payments/{payment}/verify', [FinanceController::class, 'verifyPayment']);

        // Income & Expense
        Route::get('/incomes', [FinanceController::class, 'indexIncomes']);
        Route::post('/incomes', [FinanceController::class, 'storeIncome']);
        Route::get('/expenses', [FinanceController::class, 'indexExpenses']);
        Route::post('/expenses', [FinanceController::class, 'storeExpense']);

        // Reports
        Route::get('/finance/profit-loss', [FinanceController::class, 'profitLossReport']);
        Route::get('/finance/dashboard', [FinanceController::class, 'dashboard']);

        // Events
        Route::get('/manage/events', [EventController::class, 'index']);
        Route::post('/manage/events', [EventController::class, 'store']);
        Route::get('/manage/events/{event}', [EventController::class, 'show']);
        Route::put('/manage/events/{event}', [EventController::class, 'update']);
        Route::delete('/manage/events/{event}', [EventController::class, 'destroy']);
        Route::get('/manage/events/{event}/participants', [EventController::class, 'participants']);
        Route::post('/registrations/{registration}/confirm', [EventController::class, 'confirmRegistration']);
        Route::post('/registrations/{registration}/cancel', [EventController::class, 'cancelRegistration']);

        // Certificate Templates
        Route::get('/certificate-templates', [CertificateController::class, 'indexTemplates']);
        Route::post('/certificate-templates', [CertificateController::class, 'storeTemplate']);
        Route::get('/certificate-templates/{template}', [CertificateController::class, 'showTemplate']);
        Route::put('/certificate-templates/{template}', [CertificateController::class, 'updateTemplate']);
        Route::delete('/certificate-templates/{template}', [CertificateController::class, 'destroyTemplate']);

        // Certificate Issuance
        Route::post('/certificates/issue-course', [CertificateController::class, 'issueForCourse']);
        Route::post('/certificates/issue-event', [CertificateController::class, 'issueForEvent']);
        Route::post('/certificates/batch-issue-event', [CertificateController::class, 'batchIssueForEvent']);
        Route::get('/certificates', [CertificateController::class, 'indexCertificates']);

        // Audit Logs
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });

    // Student event registration
    Route::middleware('role:siswa,tutor,admin_cabang,super_admin')->group(function () {
        Route::post('/events/{event}/register', [EventController::class, 'register']);

        // Student invoices
        Route::get('/invoices/my', [FinanceController::class, 'myInvoices']);

        // Midtrans payment
        Route::post('/midtrans/snap', [MidtransController::class, 'createSnapToken']);
        Route::get('/midtrans/check-status', [MidtransController::class, 'checkStatus']);

        // Student certificates
        Route::get('/my-certificates', [CertificateController::class, 'myCertificates']);
    });
});
