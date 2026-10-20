<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderStatusHistory;

class KitchenController extends Controller
{
    public function index()
    {
        // Active orders for kitchen display
        $orders = Order::with(['items.addons', 'table'])
            ->whereIn('order_status', ['confirmed', 'preparing', 'ready'])
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function startPreparing(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $order->order_status = 'preparing';
        $order->save();

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => 'confirmed',
            'to_status' => 'preparing',
            'user_id' => $request->user() ? $request->user()->id : null,
            'notes' => 'Dapur mulai mempersiapkan pesanan',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pesanan {$order->order_number} sedang dipersiapkan.",
            'data' => $order,
        ]);
    }

    public function markReady(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $order->order_status = 'ready';
        $order->save();

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => 'preparing',
            'to_status' => 'ready',
            'user_id' => $request->user() ? $request->user()->id : null,
            'notes' => 'Pesanan siap disajikan / diambil',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pesanan {$order->order_number} telah siap disajikan.",
            'data' => $order,
        ]);
    }
}
