<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            $table->string('qris_provider')->default('dana'); // dana, midtrans, xendit, bca
            $table->string('qris_type')->default('static'); // static, dynamic
            $table->string('qris_merchant_name')->default('Renato Kitchen - DANA Bisnis');
            $table->string('qris_nmid')->default('ID1020268899001');
            $table->text('qris_image_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_settings', function (Blueprint $table) {
            $table->dropColumn([
                'qris_provider',
                'qris_type',
                'qris_merchant_name',
                'qris_nmid',
                'qris_image_url',
            ]);
        });
    }
};
