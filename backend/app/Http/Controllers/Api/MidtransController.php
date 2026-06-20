<?php

namespace App\Http\Controllers\Api;

use App\Models\Invoice;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MidtransController
{
    private MidtransService $midtrans;

    public function __construct(MidtransService $midtrans)
    {
        $this->midtrans = $midtrans;
    }

    /**
     * Create a Snap token for an invoice payment.
     * Returns the Snap token + redirect URL for frontend.
     */
    public function createSnapToken(Request $request): JsonResponse
    {
        $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
        ]);

        $invoice = Invoice::with('user')->findOrFail($request->invoice_id);

        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Invoice already paid.'], 422);
        }

        // Only invoice owner or admin can create payment
        $user = $request->user();
        if ($user->role === 'siswa' && $invoice->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        try {
            $snap = $this->midtrans->createSnapTransaction($invoice);

            return response()->json([
                'token' => $snap['token'],
                'redirect_url' => $snap['redirect_url'],
                'client_key' => $this->midtrans->getClientKey(),
                'is_production' => config('services.midtrans.is_production', false),
            ]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Check transaction status from Midtrans (for frontend polling).
     */
    public function checkStatus(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|string',
        ]);

        $status = $this->midtrans->checkTransaction($request->order_id);
        return response()->json($status);
    }

    /**
     * Midtrans webhook handler (no auth required).
     * Called by Midtrans server when payment status changes.
     */
    public function webhook(Request $request): JsonResponse
    {
        $notification = $request->all();

        Log::info('Midtrans webhook received', $notification);

        // Verify signature
        if (!$this->midtrans->verifyNotification($notification)) {
            Log::warning('Midtrans webhook: invalid signature', $notification);
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        // Process the notification
        $payment = $this->midtrans->processNotification($notification);

        if ($payment) {
            Log::info('Midtrans payment processed', [
                'payment_id' => $payment->id,
                'status' => $payment->verification_status,
            ]);
            return response()->json(['message' => 'OK']);
        }

        return response()->json(['message' => 'Invoice not found.'], 404);
    }

    /**
     * Get client key for frontend Snap initialization.
     */
    public function config(): JsonResponse
    {
        return response()->json([
            'client_key' => $this->midtrans->getClientKey(),
            'is_production' => config('services.midtrans.is_production', false),
        ]);
    }
}
