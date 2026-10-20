<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('Renato Kitchen / Resto');
            $table->string('phone')->default('+62 812-3456-7890');
            $table->string('email')->default('contact@renatokitchen.id');
            $table->text('address')->nullable();
            $table->string('currency')->default('IDR');
            $table->decimal('tax_rate', 5, 2)->default(10.00); // 10% PB1
            $table->decimal('service_charge_rate', 5, 2)->default(5.00); // 5% Service Charge
            $table->boolean('is_tax_enabled')->default(true);
            $table->boolean('is_service_charge_enabled')->default(true);
            $table->string('receipt_footer')->default('Terima kasih atas kunjungan Anda di Renato Kitchen!');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_settings');
    }
};
