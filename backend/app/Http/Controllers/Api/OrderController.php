<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddon;
use App\Models\OrderStatusHistory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductAddon;
use App\Models\DiningTable;
use App\Models\RestaurantSetting;
use App\Models\Ingredient;
use App\Models\InventoryMovement;
use App\Models\Payment;
use App\Models\AuditLog;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['items.addons', 'table', 'user', 'payment']);

        if ($request->has('order_status') && $request->order_status != '') {
            $query->where('order_status', $request->order_status);
        }

        if ($request->has('payment_status') && $request->payment_status != '') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->has('order_type') && $request->order_type != '') {
            $query->where('order_type', $request->order_type);
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        $orders = $query->orderBy('id', 'desc')->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show($id)
    {
        $order = Order::with(['items.addons', 'table', 'user', 'payment', 'statusHistories.user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_type' => 'required|in:dine_in,takeaway,online',
            'table_id' => 'nullable|exists:dining_tables,id',
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.variant_id' => 'nullable|exists:product_variants,id',
            'items.*.addon_ids' => 'nullable|array',
            'items.*.addon_ids.*' => 'exists:product_addons,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.special_notes' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $settings = RestaurantSetting::first();
            $taxRate = ($settings && $settings->is_tax_enabled) ? $settings->tax_rate : 0;
            $serviceRate = ($settings && $settings->is_service_charge_enabled) ? $settings->service_charge_rate : 0;

            // Generate unique Order Number
            $orderDateStr = now()->format('Ymd');
            $todayCount = Order::whereDate('created_at', now()->toDateString())->count() + 1;
            $orderNumber = sprintf('RN-%s-%04d', $orderDateStr, $todayCount);

            $order = Order::create([
                'order_number' => $orderNumber,
                'order_type' => $validated['order_type'],
                'table_id' => $validated['table_id'] ?? null,
                'user_id' => $request->user() ? $request->user()->id : null,
                'customer_name' => $validated['customer_name'] ?? 'Tamu',
                'customer_phone' => $validated['customer_phone'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'order_status' => 'confirmed', // masuk antrian persiapan dapur
                'payment_status' => 'pending',
                'subtotal' => 0,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'service_charge_amount' => 0,
                'total_amount' => 0,
            ]);

            $calculatedSubtotal = 0;

            foreach ($validated['items'] as $itemData) {
                $product = Product::with(['variants', 'addons', 'recipe.items.ingredient'])->lockForUpdate()->findOrFail($itemData['product_id']);

                if (!$product->is_available) {
                    abort(422, "Produk {$product->name} saat ini sedang tidak tersedia.");
                }

                $unitPrice = $product->base_price;
                $costPrice = $product->cost_price;
                $variantName = null;

                if (!empty($itemData['variant_id'])) {
                    $variant = ProductVariant::findOrFail($itemData['variant_id']);
                    $unitPrice += $variant->price_adjustment;
                    $variantName = $variant->name;
                }

                $itemSubtotal = $unitPrice * $itemData['quantity'];

                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'variant_id' => $itemData['variant_id'] ?? null,
                    'product_name' => $product->name,
                    'variant_name' => $variantName,
                    'unit_price' => $unitPrice,
                    'cost_price' => $costPrice,
                    'quantity' => $itemData['quantity'],
                    'subtotal' => $itemSubtotal,
                    'special_notes' => $itemData['special_notes'] ?? null,
                ]);

                // Addons calculation
                if (!empty($itemData['addon_ids'])) {
                    foreach ($itemData['addon_ids'] as $addonId) {
                        $addon = ProductAddon::findOrFail($addonId);
                        OrderItemAddon::create([
                            'order_item_id' => $orderItem->id,
                            'addon_name' => $addon->name,
                            'price' => $addon->price,
                        ]);
                        $addonTotal = $addon->price * $itemData['quantity'];
                        $itemSubtotal += $addonTotal;
                    }
                    $orderItem->subtotal = $itemSubtotal;
                    $orderItem->save();
                }

                $calculatedSubtotal += $itemSubtotal;

                // Recipe BOM Stock Auto-Depletion
                if ($product->recipe && $product->recipe->items->isNotEmpty()) {
                    foreach ($product->recipe->items as $recipeItem) {
                        $deductQty = $recipeItem->quantity * $itemData['quantity'];
                        $ingredient = $recipeItem->ingredient;
                        
                        if ($ingredient) {
                            $ingredient->decrement('current_stock', $deductQty);

                            InventoryMovement::create([
                                'ingredient_id' => $ingredient->id,
                                'movement_type' => 'out',
                                'quantity' => $deductQty,
                                'cost_per_unit' => $ingredient->cost_per_unit,
                                'reference_type' => 'order',
                                'reference_id' => $order->id,
                                'reason' => "Pemakaian resep untuk pesanan {$order->order_number} ({$product->name} x{$itemData['quantity']})",
                                'user_id' => $request->user() ? $request->user()->id : null,
                            ]);
                        }
                    }
                }
            }

            // Taxes & Service Charge
            $taxAmount = round(($calculatedSubtotal * $taxRate) / 100, 2);
            $serviceAmount = round(($calculatedSubtotal * $serviceRate) / 100, 2);
            $totalAmount = $calculatedSubtotal + $taxAmount + $serviceAmount;

            $order->update([
                'subtotal' => $calculatedSubtotal,
                'tax_amount' => $taxAmount,
                'service_charge_amount' => $serviceAmount,
                'total_amount' => $totalAmount,
            ]);

            // Update dining table status if dine_in
            if ($order->order_type === 'dine_in' && $order->table_id) {
                DiningTable::where('id', $order->table_id)->update([
                    'status' => 'occupied',
                    'current_order_id' => $order->id,
                ]);
            }

            // Record initial history
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => 'confirmed',
                'user_id' => $request->user() ? $request->user()->id : null,
                'notes' => 'Pesanan berhasil dibuat dan dikonfirmasi.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data' => $order->load(['items.addons', 'table']),
            ], 201);
        });
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'order_status' => 'required|in:pending,confirmed,preparing,ready,served,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $order = Order::findOrFail($id);
        $oldStatus = $order->order_status;
        $newStatus = $request->order_status;

        $order->order_status = $newStatus;
        if ($newStatus === 'completed') {
            $order->completed_at = now();
            if ($order->table_id) {
                DiningTable::where('id', $order->table_id)->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }
        } elseif ($newStatus === 'cancelled') {
            $order->cancelled_at = now();
            if ($order->table_id) {
                DiningTable::where('id', $order->table_id)->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }
        }
        $order->save();

        OrderStatusHistory::create([
            'order_id' => $order->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'user_id' => $request->user() ? $request->user()->id : null,
            'notes' => $request->notes ?? "Perubahan status ke {$newStatus}",
        ]);

        return response()->json([
            'success' => true,
            'message' => "Status pesanan diperbarui menjadi {$newStatus}.",
            'data' => $order,
        ]);
    }

    public function processPayment(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $request->validate([
            'payment_method' => 'required|in:cash,qris,transfer',
            'amount_paid' => 'required|numeric|min:' . $order->total_amount,
        ]);

        $changeAmount = $request->amount_paid - $order->total_amount;

        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'payment_method' => $request->payment_method,
                'amount_paid' => $request->amount_paid,
                'change_amount' => $changeAmount,
                'transaction_ref' => ($request->payment_method === 'qris') ? 'QRIS-' . strtoupper(uniqid()) : null,
                'status' => 'paid',
                'user_id' => $request->user() ? $request->user()->id : null,
                'paid_at' => now(),
            ]
        );

        $order->payment_status = 'paid';
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil diproses.',
            'data' => [
                'order' => $order,
                'payment' => $payment,
            ],
        ]);
    }
}
