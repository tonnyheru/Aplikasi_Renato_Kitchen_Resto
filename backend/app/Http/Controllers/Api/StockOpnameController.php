<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Models\Ingredient;
use App\Models\InventoryMovement;

class StockOpnameController extends Controller
{
    public function index()
    {
        $opnames = StockOpname::with(['creator', 'approver'])
            ->withCount('items')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $opnames,
        ]);
    }

    public function show($id)
    {
        $opname = StockOpname::with(['items.ingredient', 'creator', 'approver'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $opname,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $opnameNumber = 'SO-' . now()->format('Ymd') . '-' . sprintf('%03d', StockOpname::whereDate('created_at', now()->toDateString())->count() + 1);

            $opname = StockOpname::create([
                'opname_number' => $opnameNumber,
                'status' => 'draft',
                'created_by' => $request->user() ? $request->user()->id : null,
                'notes' => $request->notes,
            ]);

            // Take snapshot of all active ingredients
            $ingredients = Ingredient::where('is_active', true)->get();
            foreach ($ingredients as $ing) {
                StockOpnameItem::create([
                    'stock_opname_id' => $opname->id,
                    'ingredient_id' => $ing->id,
                    'system_stock' => $ing->current_stock,
                    'physical_stock' => $ing->current_stock, // default to system until counted
                    'discrepancy' => 0,
                    'discrepancy_cost' => 0,
                    'reason' => null,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "Sesi Stock Opname {$opname->opname_number} berhasil dibuat.",
                'data' => $opname->load('items.ingredient'),
            ], 201);
        });
    }

    public function submitCount(Request $request, $id)
    {
        $opname = StockOpname::with('items.ingredient')->findOrFail($id);

        if ($opname->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya sesi berstatus draft yang dapat diinputkan hasil hitung fisik.',
            ], 422);
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:stock_opname_items,id',
            'items.*.physical_stock' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $opname) {
            foreach ($request->items as $itemData) {
                $item = StockOpnameItem::with('ingredient')->find($itemData['id']);
                if ($item && $item->stock_opname_id === $opname->id) {
                    $discrepancy = $itemData['physical_stock'] - $item->system_stock;
                    $discrepancyCost = $discrepancy * ($item->ingredient ? $item->ingredient->cost_per_unit : 0);

                    $item->update([
                        'physical_stock' => $itemData['physical_stock'],
                        'discrepancy' => $discrepancy,
                        'discrepancy_cost' => $discrepancyCost,
                        'reason' => $itemData['reason'] ?? null,
                    ]);
                }
            }

            $opname->status = 'submitted';
            $opname->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Hasil penghitungan fisik berhasil disubmit dan menunggu persetujuan Manager/Owner.',
            'data' => $opname->fresh('items.ingredient'),
        ]);
    }

    public function approve(Request $request, $id)
    {
        $opname = StockOpname::with('items.ingredient')->findOrFail($id);

        if ($opname->status !== 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya sesi berstatus submitted yang dapat disetujui.',
            ], 422);
        }

        return DB::transaction(function () use ($request, $opname) {
            foreach ($opname->items as $item) {
                if ($item->discrepancy != 0 && $item->ingredient) {
                    // Update ingredient stock
                    $item->ingredient->current_stock = $item->physical_stock;
                    $item->ingredient->save();

                    // Record inventory movement
                    InventoryMovement::create([
                        'ingredient_id' => $item->ingredient_id,
                        'movement_type' => 'adjustment',
                        'quantity' => abs($item->discrepancy),
                        'cost_per_unit' => $item->ingredient->cost_per_unit,
                        'reference_type' => 'stock_opname',
                        'reference_id' => $opname->id,
                        'reason' => "Penyesuaian hasil Stock Opname {$opname->opname_number}. Alasan: " . ($item->reason ?? 'Selisih opname fisik'),
                        'user_id' => $request->user() ? $request->user()->id : null,
                    ]);
                }
            }

            $opname->status = 'approved';
            $opname->approved_by = $request->user() ? $request->user()->id : null;
            $opname->approved_at = now();
            $opname->save();

            return response()->json([
                'success' => true,
                'message' => "Stock Opname {$opname->opname_number} berhasil disetujui dan stok telah disinkronkan.",
                'data' => $opname->fresh(['items.ingredient', 'approver']),
            ]);
        });
    }
}
