<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransService
{
    private string $serverKey;
    private string $clientKey;
    private string $baseUrl;
    private bool $isProduction;

    public function __construct()
    {
        $this->isProduction = config('services.midtrans.is_production', false);
        $this->serverKey = config('services.midtrans.server_key', '');
        $this->clientKey = config('services.midtrans.client_key', '');
        $this->baseUrl = $this->isProduction
            ? 'https://app.midtrans.com/snap/v1'
            : 'https://app.sandbox.midtrans.com/snap/v1';
    }

    /**
     * Create a Snap transaction token for an invoice.
     */
    public function createSnapTransaction(Invoice $invoice, array $customerDetails = []): array
    {
        $payload = [
            'transaction_details' => [
                'order_id' => $invoice->invoice_number,
                'gross_amount' => (int) $invoice->amount,
            ],
            'customer_details' => array_merge([
                'first_name' => $invoice->user->name ?? 'Customer',
                'email' => $invoice->user->email ?? '',
                'phone' => $invoice->user->phone ?? '',
            ], $customerDetails),
            'enabled_payments' => [
                'gopay', 'shopeepay', 'bank_transfer', 'bca_va',
                'bni_va', 'bri_va', 'permata_va', 'other_va',
                'credit_card', 'echannel', 'cimb_clicks',
            ],
            'item_details' => [
                [
                    'id' => 'invoice-' . $invoice->id,
                    'price' => (int) $invoice->amount,
                    'quantity' => 1,
                    'name' => 'Invoice ' . $invoice->invoice_number,
                ],
            ],
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
        ])->post("{$this->baseUrl}/transactions", $payload);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Midtrans Snap creation failed', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        throw new \RuntimeException('Failed to create Midtrans transaction: ' . $response->body());
    }

    /**
     * Verify webhook notification signature and return parsed data.
     */
    public function verifyNotification(array $notification): bool
    {
        $orderId = $notification['order_id'] ?? '';
        $statusCode = $notification['status_code'] ?? '';
        $grossAmount = $notification['gross_amount'] ?? '';
        $signatureKey = $notification['signature_key'] ?? '';

        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $this->serverKey);
        return hash_equals($expectedSignature, $signatureKey);
    }

    /**
     * Get transaction status from Midtrans.
     */
    public function checkTransaction(string $orderId): array
    {
        $baseUrl = $this->isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';

        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Authorization' => 'Basic ' . base64_encode($this->serverKey . ':'),
        ])->get("{$baseUrl}/{$orderId}/status");

        return $response->json();
    }

    /**
     * Process a verified notification: update payment + invoice status.
     */
    public function processNotification(array $notification): ?Payment
    {
        $orderId = $notification['order_id'] ?? '';
        $transactionStatus = $notification['transaction_status'] ?? '';
        $transactionId = $notification['transaction_id'] ?? '';

        // Find the invoice by order_id (we use invoice_number as order_id)
        $invoice = Invoice::where('invoice_number', $orderId)->first();
        if (!$invoice) {
            Log::warning('Midtrans notification: invoice not found', ['order_id' => $orderId]);
            return null;
        }

        // Find or create payment
        $payment = Payment::firstOrCreate(
            ['transaction_ref' => $transactionId],
            [
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
                'method' => 'gateway',
                'verification_status' => 'pending',
            ]
        );

        // Update based on transaction status
        match ($transactionStatus) {
            'settlement', 'capture' => $this->handleSettlement($payment, $invoice, $notification),
            'pending' => $payment->update(['notes' => 'Payment pending']),
            'deny', 'failure' => $payment->update([
                'verification_status' => 'rejected',
                'notes' => 'Payment denied: ' . $transactionStatus,
            ]),
            'cancel', 'expire' => $this->handleCancelExpire($payment, $invoice, $transactionStatus),
            default => Log::info('Midtrans unhandled status', ['status' => $transactionStatus]),
        };

        return $payment->fresh();
    }

    private function handleSettlement(Payment $payment, Invoice $invoice, array $notification): void
    {
        $payment->update([
            'verification_status' => 'verified',
            'verified_at' => now(),
            'transaction_ref' => $notification['transaction_id'] ?? $payment->transaction_ref,
            'notes' => 'Gateway: ' . ($notification['payment_type'] ?? 'unknown'),
        ]);

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Auto-create income record
        $branchId = $invoice->user->branch_id ?? null;
        if ($branchId) {
            \App\Models\Income::create([
                'branch_id' => $branchId,
                'description' => 'Gateway payment for ' . $invoice->invoice_number,
                'amount' => $payment->amount,
                'category' => 'tuition',
                'date' => now()->toDateString(),
                'payment_id' => $payment->id,
                'created_by' => 1, // system
            ]);
        }
    }

    private function handleCancelExpire(Payment $payment, Invoice $invoice, string $status): void
    {
        $payment->update([
            'verification_status' => 'rejected',
            'notes' => 'Payment ' . $status,
        ]);
        // Invoice stays unpaid (user can retry)
    }

    public function getClientKey(): string
    {
        return $this->clientKey;
    }
}
