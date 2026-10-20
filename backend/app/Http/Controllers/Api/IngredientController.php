<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Ingredient;
use App\Models\InventoryMovement;

class IngredientController extends Controller
{
    public function index(Request $request)
    {
        $query = Ingredient::with('supplier');

        if ($request->boolean('low_stock_only')) {
            $query->whereColumn('current_stock', '<=', 'min_stock');
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $ingredients = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $ingredients,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'unit' => 'required|string|max:30',
            'category' => 'required|string|max:100',
            'current_stock' => 'required|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $count = Ingredient::count() + 1;
        $sku = 'ING-' . strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $request->name), 0, 6)) . str_pad($count, 3, '0', STR_PAD_LEFT);

        $ingredient = Ingredient::create([
            'sku' => $sku,
            'name' => $request->name,
            'unit' => $request->unit,
            'category' => $request->category,
            'current_stock' => $request->current_stock,
            'min_stock' => $request->min_stock,
            'cost_per_unit' => $request->cost_per_unit,
            'supplier_id' => $request->supplier_id,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Bahan baku '{$ingredient->name}' berhasil ditambahkan.",
            'data' => $ingredient->load('supplier'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:150',
            'unit' => 'required|string|max:30',
            'category' => 'required|string|max:100',
            'min_stock' => 'required|numeric|min:0',
            'cost_per_unit' => 'required|numeric|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        $ingredient->update([
            'name' => $request->name,
            'unit' => $request->unit,
            'category' => $request->category,
            'min_stock' => $request->min_stock,
            'cost_per_unit' => $request->cost_per_unit,
            'supplier_id' => $request->supplier_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Bahan baku '{$ingredient->name}' berhasil diperbarui.",
            'data' => $ingredient->load('supplier'),
        ]);
    }

    public function recordMovement(Request $request)
    {
        $validated = $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'movement_type' => 'required|in:in,out,adjustment,waste',
            'quantity' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $ingredient = Ingredient::lockForUpdate()->findOrFail($validated['ingredient_id']);

            if (in_array($validated['movement_type'], ['out', 'waste'])) {
                $ingredient->decrement('current_stock', $validated['quantity']);
            } elseif ($validated['movement_type'] === 'in') {
                $ingredient->increment('current_stock', $validated['quantity']);
            } elseif ($validated['movement_type'] === 'adjustment') {
                $ingredient->current_stock = $validated['quantity'];
                $ingredient->save();
            }

            $movement = InventoryMovement::create([
                'ingredient_id' => $ingredient->id,
                'movement_type' => $validated['movement_type'],
                'quantity' => $validated['quantity'],
                'cost_per_unit' => $ingredient->cost_per_unit,
                'reference_type' => 'manual',
                'reason' => $validated['reason'],
                'user_id' => $request->user() ? $request->user()->id : null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mutasi stok berhasil dicatat.',
                'data' => [
                    'ingredient' => $ingredient,
                    'movement' => $movement,
                ],
            ]);
        });
    }

    public function movements($id)
    {
        $movements = InventoryMovement::where('ingredient_id', $id)
            ->with('user')
            ->orderBy('id', 'desc')
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $movements,
        ]);
    }

    public function destroy($id)
    {
        $ingredient = Ingredient::findOrFail($id);

        // Check if ingredient is used in any recipes
        $usedInRecipe = \App\Models\RecipeItem::where('ingredient_id', $id)->exists();
        if ($usedInRecipe) {
            return response()->json([
                'success' => false,
                'message' => "Bahan baku '{$ingredient->name}' tidak dapat dihapus karena masih digunakan dalam resep menu.",
            ], 422);
        }

        $name = $ingredient->name;
        $ingredient->delete();

        return response()->json([
            'success' => true,
            'message' => "Bahan baku '{$name}' berhasil dihapus.",
        ]);
    }
}
