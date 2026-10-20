<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CashShift;
use App\Models\Payment;

class CashShiftController extends Controller
{
    public function current(Request $request)
    {
        $user = $request->user();
        $shift = CashShift::where('user_id', $user->id)
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        // Calculate cash collected during this shift
        if ($shift) {
            $cashCollected = Payment::where('user_id', $user->id)
                ->where('payment_method', 'cash')
                ->where('paid_at', '>=', $shift->opened_at)
                ->sum('amount_paid');

            $expectedCash = $shift->start_cash + $cashCollected;
            $shift->expected_cash = $expectedCash;
            $shift->cash_sales = $cashCollected;
        }

        return response()->json([
            'success' => true,
            'data' => $shift,
        ]);
    }

    public function open(Request $request)
    {
        $request->validate([
            'start_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();

        // Check if an open shift already exists
        $existing = CashShift::where('user_id', $user->id)->where('status', 'open')->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Anda masih memiliki shift yang sedang aktif. Silakan tutup shift sebelumnya terlebih dahulu.',
            ], 422);
        }

        $shift = CashShift::create([
            'user_id' => $user->id,
            'start_cash' => $request->start_cash,
            'expected_cash' => $request->start_cash,
            'status' => 'open',
            'opened_at' => now(),
            'notes' => $request->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift kasir berhasil dibuka.',
            'data' => $shift,
        ]);
    }

    public function close(Request $request)
    {
        $request->validate([
            'actual_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $shift = CashShift::where('user_id', $user->id)->where('status', 'open')->first();

        if (!$shift) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada shift kasir yang sedang aktif untuk ditutup.',
            ], 422);
        }

        $cashCollected = Payment::where('user_id', $user->id)
            ->where('payment_method', 'cash')
            ->where('paid_at', '>=', $shift->opened_at)
            ->sum('amount_paid');

        $expectedCash = $shift->start_cash + $cashCollected;
        $difference = $request->actual_cash - $expectedCash;

        $shift->update([
            'expected_cash' => $expectedCash,
            'actual_cash' => $request->actual_cash,
            'difference' => $difference,
            'status' => 'closed',
            'closed_at' => now(),
            'notes' => $request->notes ?? $shift->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift kasir berhasil ditutup.',
            'data' => $shift,
        ]);
    }
}
