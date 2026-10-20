<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RestaurantSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'currency',
        'tax_rate',
        'service_charge_rate',
        'is_tax_enabled',
        'is_service_charge_enabled',
        'receipt_footer',
        'qris_provider',
        'qris_type',
        'qris_merchant_name',
        'qris_nmid',
        'qris_image_url',
    ];

    protected $casts = [
        'tax_rate' => 'float',
        'service_charge_rate' => 'float',
        'is_tax_enabled' => 'boolean',
        'is_service_charge_enabled' => 'boolean',
    ];
}
