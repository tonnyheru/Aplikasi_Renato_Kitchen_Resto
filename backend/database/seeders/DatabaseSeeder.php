<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\RestaurantSetting;
use App\Models\DiningTable;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductAddon;
use App\Models\Supplier;
use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\RecipeItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\OrderStatusHistory;
use App\Models\InventoryMovement;
use App\Models\Expense;
use App\Models\CashShift;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Restaurant Settings
        RestaurantSetting::updateOrCreate(
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

        // 2. Demo Users per Role
        $defaultPassword = Hash::make('password123');

        $owner = User::updateOrCreate(
            ['email' => 'owner@renato.id'],
            ['name' => 'Renato Adiputra (Owner)', 'password' => $defaultPassword, 'role' => 'owner', 'phone' => '081211110001', 'is_active' => true]
        );

        $manager = User::updateOrCreate(
            ['email' => 'manager@renato.id'],
            ['name' => 'Budi Santoso (Manager)', 'password' => $defaultPassword, 'role' => 'manager', 'phone' => '081211110002', 'is_active' => true]
        );

        $admin = User::updateOrCreate(
            ['email' => 'admin@renato.id'],
            ['name' => 'Dewi Lestari (Admin)', 'password' => $defaultPassword, 'role' => 'admin', 'phone' => '081211110003', 'is_active' => true]
        );

        $cashier = User::updateOrCreate(
            ['email' => 'cashier@renato.id'],
            ['name' => 'Siti Rahma (Kasir)', 'password' => $defaultPassword, 'role' => 'cashier', 'phone' => '081211110004', 'is_active' => true]
        );

        $kitchen = User::updateOrCreate(
            ['email' => 'kitchen@renato.id'],
            ['name' => 'Chef Agus (Dapur)', 'password' => $defaultPassword, 'role' => 'kitchen', 'phone' => '081211110005', 'is_active' => true]
        );

        $inventory = User::updateOrCreate(
            ['email' => 'inventory@renato.id'],
            ['name' => 'Doni Saputra (Gudang)', 'password' => $defaultPassword, 'role' => 'inventory', 'phone' => '081211110006', 'is_active' => true]
        );

        // 3. Dining Tables
        for ($i = 1; $i <= 10; $i++) {
            DiningTable::updateOrCreate(
                ['table_number' => sprintf('T-%02d', $i)],
                [
                    'capacity' => ($i % 3 === 0) ? 6 : (($i % 2 === 0) ? 4 : 2),
                    'status' => ($i === 2 || $i === 5) ? 'occupied' : 'available',
                ]
            );
        }

        // 4. Categories
        $categoriesData = [
            ['name' => 'Makanan Utama', 'slug' => 'makanan-utama', 'icon' => 'Utensils', 'sort_order' => 1],
            ['name' => 'Rice Bowl', 'slug' => 'rice-bowl', 'icon' => 'Bowl', 'sort_order' => 2],
            ['name' => 'Makanan Pendamping', 'slug' => 'makanan-pendamping', 'icon' => 'Cookie', 'sort_order' => 3],
            ['name' => 'Minuman & Teh', 'slug' => 'minuman', 'icon' => 'CupSoda', 'sort_order' => 4],
            ['name' => 'Kopi', 'slug' => 'kopi', 'icon' => 'Coffee', 'sort_order' => 5],
            ['name' => 'Paket Hemat', 'slug' => 'paket-hemat', 'icon' => 'Sparkles', 'sort_order' => 6],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = Category::updateOrCreate(['slug' => $c['slug']], $c);
        }

        // 5. Suppliers
        $supPoultry = Supplier::updateOrCreate(['name' => 'PT Sumber Unggas Jaya'], ['contact_person' => 'Pak Hendra', 'phone' => '0812888801', 'email' => 'unggas@sumber.id', 'address' => 'Bogor']);
        $supPangan = Supplier::updateOrCreate(['name' => 'CV Lumbung Pangan Nusantara'], ['contact_person' => 'Ibu Ratna', 'phone' => '0812888802', 'email' => 'beras@lumbung.id', 'address' => 'Karawang']);
        $supBeverage = Supplier::updateOrCreate(['name' => 'PT Segar Alam Sejahtera'], ['contact_person' => 'Pak Tommy', 'phone' => '0812888803', 'email' => 'beverage@segar.id', 'address' => 'Jakarta']);

        // 6. Ingredients
        $ingredientsData = [
            ['sku' => 'ING-BERAS', 'name' => 'Beras Organik Pandan Wangi', 'category' => 'Bahan Pokok', 'unit' => 'gram', 'current_stock' => 50000, 'min_stock' => 10000, 'cost_per_unit' => 15, 'supplier_id' => $supPangan->id],
            ['sku' => 'ING-AYAM', 'name' => 'Daging Ayam Fillet Segar', 'category' => 'Daging & Unggas', 'unit' => 'gram', 'current_stock' => 25000, 'min_stock' => 5000, 'cost_per_unit' => 50, 'supplier_id' => $supPoultry->id],
            ['sku' => 'ING-TELUR', 'name' => 'Telur Ayam Negeri', 'category' => 'Bahan Pokok', 'unit' => 'pcs', 'current_stock' => 300, 'min_stock' => 50, 'cost_per_unit' => 2000, 'supplier_id' => $supPoultry->id],
            ['sku' => 'ING-MINYAK', 'name' => 'Minyak Goreng Sawit', 'category' => 'Minyak & Lemak', 'unit' => 'ml', 'current_stock' => 30000, 'min_stock' => 5000, 'cost_per_unit' => 18, 'supplier_id' => $supPangan->id],
            ['sku' => 'ING-CABAI', 'name' => 'Cabai Rawit Merah Segar', 'category' => 'Bumbu & Sayur', 'unit' => 'gram', 'current_stock' => 4000, 'min_stock' => 1000, 'cost_per_unit' => 45, 'supplier_id' => $supPangan->id],
            ['sku' => 'ING-KOPI', 'name' => 'Biji Kopi Arabika House Blend', 'category' => 'Minuman', 'unit' => 'gram', 'current_stock' => 8000, 'min_stock' => 2000, 'cost_per_unit' => 120, 'supplier_id' => $supBeverage->id],
            ['sku' => 'ING-SUSU', 'name' => 'Susu Segar Fresh Milk', 'category' => 'Dairy', 'unit' => 'ml', 'current_stock' => 15000, 'min_stock' => 3000, 'cost_per_unit' => 22, 'supplier_id' => $supBeverage->id],
            ['sku' => 'ING-TEH', 'name' => 'Daun Teh Melati Premium', 'category' => 'Minuman', 'unit' => 'gram', 'current_stock' => 5000, 'min_stock' => 1000, 'cost_per_unit' => 30, 'supplier_id' => $supBeverage->id],
            ['sku' => 'ING-GULA', 'name' => 'Gula Aren Cair', 'category' => 'Pemanis', 'unit' => 'ml', 'current_stock' => 10000, 'min_stock' => 2000, 'cost_per_unit' => 25, 'supplier_id' => $supBeverage->id],
            ['sku' => 'ING-KENTANG', 'name' => 'Kentang Beku Shoestring', 'category' => 'Frozen Food', 'unit' => 'gram', 'current_stock' => 12000, 'min_stock' => 3000, 'cost_per_unit' => 40, 'supplier_id' => $supPangan->id],
        ];

        $ingredients = [];
        foreach ($ingredientsData as $ing) {
            $ingredients[$ing['sku']] = Ingredient::updateOrCreate(['sku' => $ing['sku']], $ing);
        }

        // 7. Products (Menu Makanan & Minuman Resmi)
        $productsData = [
            [
                'category_id' => $categories['makanan-utama']->id,
                'sku' => 'PRD-GEPREK',
                'name' => 'Nasi Ayam Geprek Renato',
                'description' => 'Ayam krispi gurih dengan sambal bawang segar khas Renato, disajikan bersama nasi pulen hangat dan lalapan timun.',
                'image_url' => 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
                'base_price' => 28000,
                'cost_price' => 12500,
                'prep_time_minutes' => 12,
                'variants' => [
                    ['name' => 'Level 1 (Pedas Santai)', 'price_adjustment' => 0],
                    ['name' => 'Level 2 (Pedas Sedang)', 'price_adjustment' => 0],
                    ['name' => 'Level 3 (Pedas Nampol)', 'price_adjustment' => 2000],
                ],
                'addons' => [
                    ['name' => 'Telur Ceplok Goreng', 'price' => 4000],
                    ['name' => 'Ekstra Sambal Bawang', 'price' => 3000],
                ],
                'recipe' => [
                    ['ingredient' => 'ING-BERAS', 'qty' => 150],
                    ['ingredient' => 'ING-AYAM', 'qty' => 180],
                    ['ingredient' => 'ING-MINYAK', 'qty' => 30],
                    ['ingredient' => 'ING-CABAI', 'qty' => 25],
                ]
            ],
            [
                'category_id' => $categories['rice-bowl']->id,
                'sku' => 'PRD-TERIYAKI',
                'name' => 'Nasi Ayam Teriyaki Bowl',
                'description' => 'Potongan paha ayam saus teriyaki manis gurih beraroma wijen sangrai di atas nasi hangat aromatik.',
                'image_url' => 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&w=600&q=80',
                'base_price' => 32000,
                'cost_price' => 14000,
                'prep_time_minutes' => 15,
                'variants' => [
                    ['name' => 'Reguler', 'price_adjustment' => 0],
                    ['name' => 'Porsi Jumbo (Ekstra Daging)', 'price_adjustment' => 10000],
                ],
                'addons' => [
                    ['name' => 'Telur Onsen', 'price' => 5000],
                    ['name' => 'Taburan Wijen Ekstra', 'price' => 2000],
                ],
                'recipe' => [
                    ['ingredient' => 'ING-BERAS', 'qty' => 150],
                    ['ingredient' => 'ING-AYAM', 'qty' => 200],
                    ['ingredient' => 'ING-MINYAK', 'qty' => 20],
                ]
            ],
            [
                'category_id' => $categories['makanan-utama']->id,
                'sku' => 'PRD-NASGOR',
                'name' => 'Nasi Goreng Spesial Renato',
                'description' => 'Nasi goreng bumbu rempah pilihan dilengkapi suwiran ayam, bakso, telur mata sapi, dan kerupuk renyah.',
                'image_url' => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
                'base_price' => 30000,
                'cost_price' => 11000,
                'prep_time_minutes' => 10,
                'variants' => [
                    ['name' => 'Tidak Pedas', 'price_adjustment' => 0],
                    ['name' => 'Pedas Sedang', 'price_adjustment' => 0],
                    ['name' => 'Pedas Banget', 'price_adjustment' => 0],
                ],
                'addons' => [
                    ['name' => 'Ekstra Telur Ceplok', 'price' => 4000],
                ],
                'recipe' => [
                    ['ingredient' => 'ING-BERAS', 'qty' => 180],
                    ['ingredient' => 'ING-TELUR', 'qty' => 1],
                    ['ingredient' => 'ING-AYAM', 'qty' => 80],
                    ['ingredient' => 'ING-MINYAK', 'qty' => 25],
                ]
            ],
            [
                'category_id' => $categories['rice-bowl']->id,
                'sku' => 'PRD-KATSU',
                'name' => 'Chicken Katsu Rice Bowl',
                'description' => 'Dada ayam berbalut tepung roti panko jepang krispi renyah, saus katsu gurih, dan irisan kubis segar.',
                'image_url' => 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=600&q=80',
                'base_price' => 34000,
                'cost_price' => 15000,
                'prep_time_minutes' => 15,
                'variants' => [
                    ['name' => 'Original Sauce', 'price_adjustment' => 0],
                    ['name' => 'Curry Sauce', 'price_adjustment' => 4000],
                ],
                'addons' => [
                    ['name' => 'Keju Melted', 'price' => 5000],
                ],
                'recipe' => [
                    ['ingredient' => 'ING-BERAS', 'qty' => 150],
                    ['ingredient' => 'ING-AYAM', 'qty' => 200],
                    ['ingredient' => 'ING-MINYAK', 'qty' => 40],
                ]
            ],
            [
                'category_id' => $categories['makanan-pendamping']->id,
                'sku' => 'PRD-FRIES',
                'name' => 'Kentang Goreng Renyah (French Fries)',
                'description' => 'Kentang goreng gurih renyah disajikan dengan saus sambal dan mayones istimewa.',
                'image_url' => 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=600&q=80',
                'base_price' => 18000,
                'cost_price' => 7000,
                'prep_time_minutes' => 8,
                'variants' => [
                    ['name' => 'Sea Salt', 'price_adjustment' => 0],
                    ['name' => 'Bumbu BBQ', 'price_adjustment' => 2000],
                    ['name' => 'Bumbu Balado', 'price_adjustment' => 2000],
                ],
                'addons' => [
                    ['name' => 'Dip Saus Keju', 'price' => 3500],
                ],
                'recipe' => [
                    ['ingredient' => 'ING-KENTANG', 'qty' => 180],
                    ['ingredient' => 'ING-MINYAK', 'qty' => 40],
                ]
            ],
            [
                'category_id' => $categories['kopi']->id,
                'sku' => 'PRD-KOPISUSU',
                'name' => 'Es Kopi Susu Renato Gula Aren',
                'description' => 'Espresso arabika dipadu susu segar dingin dan manis legitnya gula aren murni.',
                'image_url' => 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
                'base_price' => 22000,
                'cost_price' => 6800,
                'prep_time_minutes' => 5,
                'variants' => [
                    ['name' => 'Ice (Dingin)', 'price_adjustment' => 0],
                    ['name' => 'Hot (Hangat)', 'price_adjustment' => 0],
                ],
                'addons' => [
                    ['name' => 'Ekstra Shot Espresso', 'price' => 5000],
                    ['name' => 'Oatmilk Swap', 'price' => 6000],
                ],
                'recipe' => [
                    ['ingredient' => 'ING-KOPI', 'qty' => 20],
                    ['ingredient' => 'ING-SUSU', 'qty' => 120],
                    ['ingredient' => 'ING-GULA', 'qty' => 30],
                ]
            ],
            [
                'category_id' => $categories['minuman']->id,
                'sku' => 'PRD-TEHMANIS',
                'name' => 'Es Teh Manis Melati',
                'description' => 'Seduhan teh melati wangi khas nusantara disajikan segar dan manis dingin.',
                'image_url' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
                'base_price' => 8000,
                'cost_price' => 1500,
                'prep_time_minutes' => 3,
                'variants' => [
                    ['name' => 'Dingin', 'price_adjustment' => 0],
                    ['name' => 'Hangat', 'price_adjustment' => 0],
                ],
                'addons' => [],
                'recipe' => [
                    ['ingredient' => 'ING-TEH', 'qty' => 10],
                    ['ingredient' => 'ING-GULA', 'qty' => 25],
                ]
            ],
            [
                'category_id' => $categories['minuman']->id,
                'sku' => 'PRD-LEMONTEA',
                'name' => 'Es Lemon Tea Segar',
                'description' => 'Kombinasi teh melati dengan perasan lemon segar asli, asam manis menyegarkan.',
                'image_url' => 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
                'base_price' => 15000,
                'cost_price' => 3500,
                'prep_time_minutes' => 4,
                'variants' => [],
                'addons' => [],
                'recipe' => [
                    ['ingredient' => 'ING-TEH', 'qty' => 10],
                    ['ingredient' => 'ING-GULA', 'qty' => 25],
                ]
            ],
            [
                'category_id' => $categories['minuman']->id,
                'sku' => 'PRD-COKELAT',
                'name' => 'Es Cokelat Signature',
                'description' => 'Cokelat premium pekat dipadukan susu murni gurih lembut, tidak terlalu manis.',
                'image_url' => 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80',
                'base_price' => 24000,
                'cost_price' => 8000,
                'prep_time_minutes' => 5,
                'variants' => [
                    ['name' => 'Ice (Dingin)', 'price_adjustment' => 0],
                    ['name' => 'Hot (Hangat)', 'price_adjustment' => 0],
                ],
                'addons' => [
                    ['name' => 'Whipped Cream', 'price' => 4000],
                ],
                'recipe' => [
                    ['ingredient' => 'ING-SUSU', 'qty' => 150],
                    ['ingredient' => 'ING-GULA', 'qty' => 20],
                ]
            ],
        ];

        foreach ($productsData as $item) {
            $product = Product::updateOrCreate(
                ['sku' => $item['sku']],
                [
                    'category_id' => $item['category_id'],
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'image_url' => $item['image_url'],
                    'base_price' => $item['base_price'],
                    'cost_price' => $item['cost_price'],
                    'prep_time_minutes' => $item['prep_time_minutes'],
                    'is_active' => true,
                    'is_available' => true,
                ]
            );

            // Variants
            if (!empty($item['variants'])) {
                foreach ($item['variants'] as $v) {
                    ProductVariant::updateOrCreate(
                        ['product_id' => $product->id, 'name' => $v['name']],
                        ['price_adjustment' => $v['price_adjustment']]
                    );
                }
            }

            // Addons
            if (!empty($item['addons'])) {
                foreach ($item['addons'] as $a) {
                    ProductAddon::updateOrCreate(
                        ['product_id' => $product->id, 'name' => $a['name']],
                        ['price' => $a['price']]
                    );
                }
            }

            // Recipe BOM
            if (!empty($item['recipe'])) {
                $recipe = Recipe::updateOrCreate(
                    ['product_id' => $product->id],
                    ['yield_servings' => 1, 'instructions' => 'Porsi standar saji Renato Kitchen']
                );

                foreach ($item['recipe'] as $r) {
                    if (isset($ingredients[$r['ingredient']])) {
                        RecipeItem::updateOrCreate(
                            ['recipe_id' => $recipe->id, 'ingredient_id' => $ingredients[$r['ingredient']]->id],
                            ['quantity' => $r['qty']]
                        );
                    }
                }
            }
        }

        // 8. Demo Cash Shift for Cashier
        $shift = CashShift::updateOrCreate(
            ['user_id' => $cashier->id, 'status' => 'open'],
            [
                'start_cash' => 500000.00, // modal kas awal Rp 500.000
                'expected_cash' => 840000.00,
                'opened_at' => now()->startOfDay()->addHours(8),
                'notes' => 'Shift Pagi Kasir Utama',
            ]
        );

        // 9. Sample Initial Orders (Historical & Active)
        $sampleOrder = Order::updateOrCreate(
            ['order_number' => 'RN-20261012-0001'],
            [
                'order_type' => 'dine_in',
                'table_id' => 2,
                'user_id' => $cashier->id,
                'customer_name' => 'Dimas Surya',
                'customer_phone' => '08123456789',
                'subtotal' => 56000.00,
                'discount_amount' => 0.00,
                'tax_amount' => 5600.00,
                'service_charge_amount' => 2800.00,
                'total_amount' => 64400.00,
                'order_status' => 'preparing', // sedang dimasak di dapur
                'payment_status' => 'paid',
                'notes' => 'Ayam geprek jangan terlalu kering.',
            ]
        );

        $geprek = Product::where('sku', 'PRD-GEPREK')->first();
        if ($geprek) {
            OrderItem::updateOrCreate(
                ['order_id' => $sampleOrder->id, 'product_id' => $geprek->id],
                [
                    'product_name' => $geprek->name,
                    'variant_name' => 'Level 2 (Pedas Sedang)',
                    'unit_price' => 28000.00,
                    'cost_price' => 12500.00,
                    'quantity' => 2,
                    'subtotal' => 56000.00,
                    'special_notes' => 'Sambal terpisah 1 porsi',
                ]
            );
        }

        Payment::updateOrCreate(
            ['order_id' => $sampleOrder->id],
            [
                'payment_method' => 'qris',
                'amount_paid' => 64400.00,
                'change_amount' => 0.00,
                'transaction_ref' => 'QRIS-RN-88912',
                'status' => 'paid',
                'user_id' => $cashier->id,
                'paid_at' => now()->subMinutes(15),
            ]
        );

        OrderStatusHistory::create([
            'order_id' => $sampleOrder->id,
            'from_status' => 'pending',
            'to_status' => 'preparing',
            'user_id' => $kitchen->id,
            'notes' => 'Pesanan diterima dapur dan mulai dimasak',
        ]);

        // 10. Sample Operational Expenses
        Expense::updateOrCreate(
            ['expense_number' => 'EXP-20261012-001'],
            [
                'category' => 'Gas & Listrik',
                'description' => 'Pembelian Tabung Gas Elpiji 12kg x 2',
                'amount' => 450000.00,
                'expense_date' => now()->format('Y-m-d'),
                'user_id' => $manager->id,
            ]
        );

        Expense::updateOrCreate(
            ['expense_number' => 'EXP-20261012-002'],
            [
                'category' => 'Kemasan & Kantong',
                'description' => 'Kotak Rice Bowl Ramah Lingkungan 500 pcs',
                'amount' => 350000.00,
                'expense_date' => now()->format('Y-m-d'),
                'user_id' => $manager->id,
            ]
        );
    }
}
