<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RestaurantSetting;

class SettingController extends Controller
{
    public function index()
    {
        $settings = RestaurantSetting::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'Renato Kitchen / Resto',
                'phone' => '+62 812-3456-7890',
                'email' => 'contact@renatokitchen.id',
                'address' => 'Jl. Boulevard Kuliner No. 88, Jakarta Selatan',
                'currency' => 'IDR',
                'tax_rate' => 10.00,
                'service_charge_rate' => 5.00,
                'is_tax_enabled' => true,
                'is_service_charge_enabled' => true,
                'receipt_footer' => 'Terima kasih atas kunjungan Anda di Renato Kitchen!',
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $settings = RestaurantSetting::first();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string|max:500',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'service_charge_rate' => 'required|numeric|min:0|max:100',
            'is_tax_enabled' => 'required|boolean',
            'is_service_charge_enabled' => 'required|boolean',
            'receipt_footer' => 'nullable|string|max:255',
            'qris_provider' => 'nullable|string|max:50',
            'qris_type' => 'nullable|string|in:static,dynamic',
            'qris_merchant_name' => 'nullable|string|max:255',
            'qris_nmid' => 'nullable|string|max:100',
            'qris_image_url' => 'nullable|string|max:1000',
        ]);

        $settings->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan restoran berhasil diperbarui.',
            'data' => $settings,
        ]);
    }
}
