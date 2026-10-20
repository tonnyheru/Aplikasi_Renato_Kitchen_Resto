<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\AuditLog;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password yang Anda masukkan salah.',
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan. Silakan hubungi Owner.',
            ], 403);
        }

        // Generate Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'LOGIN',
            'details' => "Pengguna {$user->name} ({$user->role}) berhasil login.",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                ],
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'LOGOUT',
                'details' => "Pengguna {$user->name} berhasil logout.",
                'ip_address' => $request->ip(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    // Role switcher — hanya Owner yang boleh menggunakan fitur ini
    public function switchRole(Request $request)
    {
        // Hanya Owner yang boleh switch role
        if ($request->user()->role !== 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Owner yang dapat menggunakan fitur pergantian peran.',
            ], 403);
        }

        $request->validate([
            'role' => 'required|in:owner,manager,admin,cashier,kitchen,inventory',
        ]);

        $user = User::where('role', $request->role)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Akun dengan role tersebut tidak ditemukan.',
            ], 404);
        }

        // Revoke token lama Owner, buat token baru untuk target user
        $token = $user->createToken('auth-token')->plainTextToken;

        AuditLog::create([
            'user_id'    => $request->user()->id,
            'action'     => 'SWITCH_ROLE',
            'details'    => "Owner {$request->user()->name} beralih ke role {$user->role} ({$user->name}).",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Berhasil beralih ke peran {$user->role}.",
            'data' => [
                'token' => $token,
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->role,
                    'phone' => $user->phone,
                ],
            ],
        ]);
    }
}
