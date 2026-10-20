<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductVariant;
use App\Models\ProductAddon;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\Ingredient;
use App\Models\AuditLog;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'variants', 'addons', 'recipe.items.ingredient']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }

        if ($request->boolean('available_only')) {
            $query->where('is_available', true)->where('is_active', true);
        }

        $products = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    public function show($id)
    {
        $product = Product::with(['category', 'variants', 'addons', 'recipe.items.ingredient'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'category_id' => 'required|exists:categories,id',
            'base_price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|url',
            'prep_time_minutes' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'is_available' => 'boolean',
        ]);

        // Generate SKU
        $count = Product::count() + 1;
        $sku = 'PRD-' . strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $request->name), 0, 6)) . str_pad($count, 3, '0', STR_PAD_LEFT);

        $product = Product::create([
            'name' => $request->name,
            'sku' => $sku,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'image_url' => $request->image_url,
            'base_price' => $request->base_price,
            'cost_price' => $request->cost_price ?? 0,
            'prep_time_minutes' => $request->prep_time_minutes ?? 10,
            'is_active' => $request->is_active ?? true,
            'is_available' => $request->is_available ?? true,
        ]);

        // Variants
        if ($request->filled('variants') && is_array($request->variants)) {
            foreach ($request->variants as $v) {
                ProductVariant::create([
                    'product_id' => $product->id,
                    'name' => $v['name'],
                    'price_adjustment' => $v['price_adjustment'] ?? 0,
                ]);
            }
        }

        // Addons
        if ($request->filled('addons') && is_array($request->addons)) {
            foreach ($request->addons as $a) {
                ProductAddon::create([
                    'product_id' => $product->id,
                    'name' => $a['name'],
                    'price' => $a['price'] ?? 0,
                ]);
            }
        }

        // Recipe (BOM) syncing
        if ($request->has('recipe_items') && is_array($request->recipe_items)) {
            $recipe = Recipe::create([
                'product_id' => $product->id,
                'yield_servings' => $request->input('yield_servings', 1),
                'instructions' => $request->input('instructions', 'Resep standar pembuatan menu'),
            ]);

            $calculatedHpp = 0;
            foreach ($request->recipe_items as $item) {
                if (!empty($item['ingredient_id']) && !empty($item['quantity'])) {
                    RecipeItem::create([
                        'recipe_id' => $recipe->id,
                        'ingredient_id' => $item['ingredient_id'],
                        'quantity' => $item['quantity'],
                    ]);

                    $ing = Ingredient::find($item['ingredient_id']);
                    if ($ing) {
                        $calculatedHpp += ($ing->cost_per_unit * $item['quantity']);
                    }
                }
            }

            if ($calculatedHpp > 0) {
                $product->cost_price = $calculatedHpp;
                $product->save();
            }
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'CREATE_PRODUCT',
            'details' => "Menu baru ditambahkan: {$product->name} (SKU: {$product->sku})",
            'ip_address' => $request->ip(),
        ]);

        $product->load(['category', 'variants', 'addons', 'recipe.items.ingredient']);

        return response()->json([
            'success' => true,
            'message' => "Menu '{$product->name}' berhasil ditambahkan.",
            'data' => $product,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::with(['variants', 'addons', 'recipe.items'])->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:150',
            'category_id' => 'required|exists:categories,id',
            'base_price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|url',
            'prep_time_minutes' => 'nullable|integer|min:1',
        ]);

        $product->update([
            'name' => $request->name,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'image_url' => $request->image_url,
            'base_price' => $request->base_price,
            'cost_price' => $request->cost_price ?? $product->cost_price,
            'prep_time_minutes' => $request->prep_time_minutes ?? $product->prep_time_minutes,
        ]);

        // Re-sync variants
        if ($request->has('variants') && is_array($request->variants)) {
            $product->variants()->delete();
            foreach ($request->variants as $v) {
                if (!empty($v['name'])) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'name' => $v['name'],
                        'price_adjustment' => $v['price_adjustment'] ?? 0,
                    ]);
                }
            }
        }

        // Re-sync addons
        if ($request->has('addons') && is_array($request->addons)) {
            $product->addons()->delete();
            foreach ($request->addons as $a) {
                if (!empty($a['name'])) {
                    ProductAddon::create([
                        'product_id' => $product->id,
                        'name' => $a['name'],
                        'price' => $a['price'] ?? 0,
                    ]);
                }
            }
        }

        // Re-sync Recipe (BOM)
        if ($request->has('recipe_items') && is_array($request->recipe_items)) {
            $recipe = Recipe::updateOrCreate(
                ['product_id' => $product->id],
                [
                    'yield_servings' => $request->input('yield_servings', 1),
                    'instructions' => $request->input('instructions', 'Resep standar pembuatan menu'),
                ]
            );

            $recipe->items()->delete();
            $calculatedHpp = 0;

            foreach ($request->recipe_items as $item) {
                if (!empty($item['ingredient_id']) && !empty($item['quantity'])) {
                    RecipeItem::create([
                        'recipe_id' => $recipe->id,
                        'ingredient_id' => $item['ingredient_id'],
                        'quantity' => $item['quantity'],
                    ]);

                    $ing = Ingredient::find($item['ingredient_id']);
                    if ($ing) {
                        $calculatedHpp += ($ing->cost_per_unit * $item['quantity']);
                    }
                }
            }

            if ($calculatedHpp > 0) {
                $product->cost_price = $calculatedHpp;
                $product->save();
            }
        }

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'UPDATE_PRODUCT',
            'details' => "Menu diperbarui: {$product->name}",
            'ip_address' => $request->ip(),
        ]);

        $product->load(['category', 'variants', 'addons', 'recipe.items.ingredient']);

        return response()->json([
            'success' => true,
            'message' => "Menu '{$product->name}' berhasil diperbarui.",
            'data' => $product,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $name = $product->name;
        $product->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'DELETE_PRODUCT',
            'details' => "Menu dihapus: {$name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Menu '{$name}' berhasil dihapus.",
        ]);
    }

    public function toggleAvailability(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $product->is_available = !$product->is_available;
        $product->save();

        $status = $product->is_available ? 'tersedia' : 'habis';

        return response()->json([
            'success' => true,
            'message' => "Status menu '{$product->name}' diubah menjadi {$status}.",
            'data' => $product,
        ]);
    }
}
