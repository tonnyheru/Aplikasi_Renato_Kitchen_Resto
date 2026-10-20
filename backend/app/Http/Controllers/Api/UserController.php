<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AuditLog;

class UserController extends Controller
{
    /**
     * List all users (owner/manager only)
     */
    public function index(Request $request)
    {
        $users = User::select('id', 'name', 'email', 'role', 'phone', 'is_active', 'created_at')
            ->orderBy('role')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    /**
     * Create a new user
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:owner,manager,admin,cashier,kitchen,inventory',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'is_active' => true,
        ]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'CREATE_USER',
            'details' => "Pengguna baru dibuat: {$user->name} ({$user->role})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$user->name} berhasil ditambahkan.",
            'data' => $user,
        ], 201);
    }

    /**
     * Update an existing user
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:100',
            'email' => "required|email|unique:users,email,{$id}",
            'role' => 'required|in:owner,manager,admin,cashier,kitchen,inventory',
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
            'is_active' => 'boolean',
        ]);

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'role' => $request->role,
            'phone' => $request->phone,
            'is_active' => $request->is_active ?? $user->is_active,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'UPDATE_USER',
            'details' => "Pengguna diperbarui: {$user->name} ({$user->role})",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$user->name} berhasil diperbarui.",
            'data' => $user,
        ]);
    }

    /**
     * Toggle user active/inactive status
     */
    public function toggleStatus(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent deactivating yourself
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menonaktifkan akun sendiri.',
            ], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $action = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'TOGGLE_USER_STATUS',
            'details' => "Pengguna {$user->name} telah {$action}.",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$user->name} telah {$action}.",
            'data' => $user,
        ]);
    }

    /**
     * Delete a user (owner only)
     */
    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun sendiri.',
            ], 403);
        }

        $name = $user->name;
        $user->delete();

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'DELETE_USER',
            'details' => "Pengguna dihapus: {$name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$name} berhasil dihapus.",
        ]);
    }
}
