<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // e.g. RN-20261012-0001
            $table->string('order_type')->default('dine_in'); // dine_in, takeaway, online
            $table->foreignId('table_id')->nullable()->constrained('dining_tables')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // Kasir / Waiter
            $table->string('customer_name')->default('Tamu');
            $table->string('customer_phone')->nullable();
            
            // Financials
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('service_charge_amount', 12, 2)->default(0.00);
            $table->decimal('total_amount', 12, 2)->default(0.00);
            
            // Statuses (Separated)
            $table->string('order_status')->default('confirmed'); // pending, confirmed, preparing, ready, served, completed, cancelled
            $table->string('payment_status')->default('pending'); // pending, paid, refunded, failed
            
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            
            // Snapshots to guarantee historical data integrity
            $table->string('product_name');
            $table->string('variant_name')->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->decimal('cost_price', 12, 2)->default(0.00);
            $table->integer('quantity');
            $table->decimal('subtotal', 12, 2);
            $table->string('special_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('order_item_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->string('addon_name');
            $table->decimal('price', 12, 2);
            $table->timestamps();
        });

        Schema::create('order_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('payment_method'); // cash, qris, transfer
            $table->decimal('amount_paid', 12, 2);
            $table->decimal('change_amount', 12, 2)->default(0.00);
            $table->string('transaction_ref')->nullable(); // QRIS transaction id
            $table->string('status')->default('paid'); // pending, paid, expired, failed
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // kasir pencatat
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_status_histories');
        Schema::dropIfExists('order_item_addons');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
