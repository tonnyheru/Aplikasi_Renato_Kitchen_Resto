<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Ingredient;
use App\Models\InventoryMovement;
use App\Models\AuditLog;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'user', 'items.ingredient']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function show($id)
    {
        $order = PurchaseOrder::with(['supplier', 'user', 'items.ingredient'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.ingredient_id' => 'required|exists:ingredients,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $dateStr = now()->format('Ymd');
            $todayCount = PurchaseOrder::whereDate('created_at', now()->toDateString())->count() + 1;
            $poNumber = sprintf('PO-%s-%04d', $dateStr, $todayCount);

            $po = PurchaseOrder::create([
                'po_number' => $poNumber,
                'supplier_id' => $validated['supplier_id'],
                'status' => 'submitted', // Langsung diajukan ke supplier
                'total_cost' => 0,
                'user_id' => $request->user() ? $request->user()->id : null,
            ]);

            $totalCost = 0;

            foreach ($validated['items'] as $itemData) {
                $subtotal = $itemData['quantity'] * $itemData['unit_cost'];
                $totalCost += $subtotal;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'ingredient_id' => $itemData['ingredient_id'],
                    'quantity' => $itemData['quantity'],
                    'unit_cost' => $itemData['unit_cost'],
                    'subtotal' => $subtotal,
                ]);
            }

            $po->update(['total_cost' => $totalCost]);

            $supplier = Supplier::find($validated['supplier_id']);

            AuditLog::create([
                'user_id' => $request->user() ? $request->user()->id : null,
                'action' => 'CREATE_PURCHASE_ORDER',
                'details' => "Purchase Order dibuat: {$po->po_number} ke supplier {$supplier?->name} (Total: Rp {$totalCost})",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Purchase Order {$po->po_number} berhasil dibuat.",
                'data' => $po->load(['supplier', 'items.ingredient']),
            ], 201);
        });
    }

    public function receive(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $po = PurchaseOrder::with(['items.ingredient', 'supplier'])->lockForUpdate()->findOrFail($id);

            if ($po->status === 'received') {
                return response()->json([
                    'success' => false,
                    'message' => 'Purchase Order ini sudah diterima sebelumnya.',
                ], 422);
            }

            if ($po->status === 'cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Purchase Order yang sudah dibatalkan tidak dapat diterima.',
                ], 422);
            }

            // Update PO Status
            $po->status = 'received';
            $po->received_at = now();
            $po->save();

            // Auto-increment stock in inventory & record movements
            foreach ($po->items as $item) {
                $ingredient = $item->ingredient;
                if ($ingredient) {
                    $ingredient->increment('current_stock', $item->quantity);

                    // Update unit cost to latest purchase price
                    $ingredient->cost_per_unit = $item->unit_cost;
                    $ingredient->save();

                    InventoryMovement::create([
                        'ingredient_id' => $ingredient->id,
                        'movement_type' => 'in',
                        'quantity' => $item->quantity,
                        'cost_per_unit' => $item->unit_cost,
                        'reference_type' => 'purchase_order',
                        'reference_id' => $po->id,
                        'reason' => "Penerimaan PO {$po->po_number} ({$po->supplier?->name})",
                        'user_id' => $request->user() ? $request->user()->id : null,
                    ]);
                }
            }

            AuditLog::create([
                'user_id' => $request->user() ? $request->user()->id : null,
                'action' => 'RECEIVE_PURCHASE_ORDER',
                'details' => "Penerimaan PO {$po->po_number} dikonfirmasi. Stok bahan baku otomatis bertambah.",
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Barang dari PO {$po->po_number} berhasil diterima. Stok bahan baku telah otomatis bertambah ke sistem gudang.",
                'data' => $po->fresh(['supplier', 'items.ingredient']),
            ]);
        });
    }

    public function cancel(Request $request, $id)
    {
        $po = PurchaseOrder::findOrFail($id);

        if ($po->status === 'received') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat membatalkan PO yang barangnya sudah diterima di gudang.',
            ], 422);
        }

        $po->status = 'cancelled';
        $po->save();

        AuditLog::create([
            'user_id' => $request->user() ? $request->user()->id : null,
            'action' => 'CANCEL_PURCHASE_ORDER',
            'details' => "Purchase Order {$po->po_number} dibatalkan.",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Purchase Order {$po->po_number} berhasil dibatalkan.",
            'data' => $po,
        ]);
    }
}
