<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Supplier;
use App\Models\AuditLog;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $suppliers = Supplier::withCount(['ingredients', 'purchaseOrders'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $suppliers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150|unique:suppliers,name',
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string|max:255',
        ]);

        $supplier = Supplier::create([
            ...$validated,
            'is_active' => true,
        ]);

        AuditLog::create([
            'user_id' => $request->user() ? $request->user()->id : null,
            'action' => 'CREATE_SUPPLIER',
            'details' => "Pemasok baru ditambahkan: {$supplier->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pemasok '{$supplier->name}' berhasil ditambahkan.",
            'data' => $supplier,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        $validated = $request->validate([
            'name' => "required|string|max:150|unique:suppliers,name,{$id}",
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string|max:255',
        ]);

        $supplier->update($validated);

        AuditLog::create([
            'user_id' => $request->user() ? $request->user()->id : null,
            'action' => 'UPDATE_SUPPLIER',
            'details' => "Pemasok diperbarui: {$supplier->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pemasok '{$supplier->name}' berhasil diperbarui.",
            'data' => $supplier,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $supplier = Supplier::withCount(['ingredients', 'purchaseOrders'])->findOrFail($id);

        if ($supplier->purchase_orders_count > 0 || $supplier->ingredients_count > 0) {
            return response()->json([
                'success' => false,
                'message' => "Pemasok tidak dapat dihapus karena masih memiliki riwayat PO atau bahan baku terkait.",
            ], 422);
        }

        $name = $supplier->name;
        $supplier->delete();

        AuditLog::create([
            'user_id' => $request->user() ? $request->user()->id : null,
            'action' => 'DELETE_SUPPLIER',
            'details' => "Pemasok dihapus: {$name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pemasok '{$name}' berhasil dihapus.",
        ]);
    }
}
