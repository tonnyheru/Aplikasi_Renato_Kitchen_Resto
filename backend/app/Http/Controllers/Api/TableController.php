<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DiningTable;

class TableController extends Controller
{
    public function index()
    {
        $tables = DiningTable::with('currentOrder')->orderBy('table_number')->get();

        return response()->json([
            'success' => true,
            'data' => $tables,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'table_number' => 'required|string|max:20|unique:dining_tables,table_number',
            'capacity' => 'required|integer|min:1|max:100',
        ]);

        $table = DiningTable::create([
            'table_number' => $request->table_number,
            'capacity' => $request->capacity,
            'status' => 'available',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Meja {$table->table_number} berhasil ditambahkan.",
            'data' => $table,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $table = DiningTable::findOrFail($id);

        $request->validate([
            'table_number' => "required|string|max:20|unique:dining_tables,table_number,{$id}",
            'capacity' => 'required|integer|min:1|max:100',
        ]);

        $table->update([
            'table_number' => $request->table_number,
            'capacity' => $request->capacity,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Meja {$table->table_number} berhasil diperbarui.",
            'data' => $table,
        ]);
    }

    public function destroy($id)
    {
        $table = DiningTable::findOrFail($id);

        if ($table->status === 'occupied') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus meja yang sedang digunakan.',
            ], 422);
        }

        $number = $table->table_number;
        $table->delete();

        return response()->json([
            'success' => true,
            'message' => "Meja {$number} berhasil dihapus.",
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:available,occupied,reserved,cleaning',
        ]);

        $table = DiningTable::findOrFail($id);
        $table->status = $request->status;
        if ($request->status === 'available') {
            $table->current_order_id = null;
        }
        $table->save();

        return response()->json([
            'success' => true,
            'message' => "Status meja {$table->table_number} berhasil diubah.",
            'data' => $table,
        ]);
    }
}
