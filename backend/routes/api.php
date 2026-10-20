<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TableController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\IngredientController;
use App\Http\Controllers\Api\StockOpnameController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\CashShiftController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PurchaseOrderController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/settings', [SettingController::class, 'index']);

// Public Menu / Online Ordering
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/tables', [TableController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']); // Allow guest checkout / POS
Route::get('/orders/{id}', [OrderController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/switch-role', [AuthController::class, 'switchRole']); // Owner only

    // User Management (Owner / Manager only)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // POS & Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::post('/orders/{id}/pay', [OrderController::class, 'processPayment']);

    // Kitchen Display System
    Route::get('/kitchen/orders', [KitchenController::class, 'index']);
    Route::patch('/kitchen/orders/{id}/start', [KitchenController::class, 'startPreparing']);
    Route::patch('/kitchen/orders/{id}/ready', [KitchenController::class, 'markReady']);

    // Menu Management - Full CRUD
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::patch('/products/{id}/toggle-availability', [ProductController::class, 'toggleAvailability']);

    // Table Management
    Route::post('/tables', [TableController::class, 'store']);
    Route::put('/tables/{id}', [TableController::class, 'update']);
    Route::delete('/tables/{id}', [TableController::class, 'destroy']);
    Route::patch('/tables/{id}/status', [TableController::class, 'updateStatus']);

    // Inventory & Recipe Management
    Route::get('/ingredients', [IngredientController::class, 'index']);
    Route::post('/ingredients', [IngredientController::class, 'store']);
    Route::put('/ingredients/{id}', [IngredientController::class, 'update']);
    Route::delete('/ingredients/{id}', [IngredientController::class, 'destroy']);
    Route::post('/inventory/movements', [IngredientController::class, 'recordMovement']);
    Route::get('/ingredients/{id}/movements', [IngredientController::class, 'movements']);

    // Stock Opname
    Route::get('/stock-opnames', [StockOpnameController::class, 'index']);
    Route::get('/stock-opnames/{id}', [StockOpnameController::class, 'show']);
    Route::post('/stock-opnames', [StockOpnameController::class, 'store']);
    Route::post('/stock-opnames/{id}/submit', [StockOpnameController::class, 'submitCount']);
    Route::post('/stock-opnames/{id}/approve', [StockOpnameController::class, 'approve']);

    // Suppliers & Purchase Orders (Procurement)
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);

    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::get('/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
    Route::post('/purchase-orders/{id}/receive', [PurchaseOrderController::class, 'receive']);
    Route::post('/purchase-orders/{id}/cancel', [PurchaseOrderController::class, 'cancel']);

    // Cash Shifts
    Route::get('/shifts/current', [CashShiftController::class, 'current']);
    Route::post('/shifts/open', [CashShiftController::class, 'open']);
    Route::post('/shifts/close', [CashShiftController::class, 'close']);

    // Reports & Dashboard
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/expenses', [ReportController::class, 'expenses']);
    Route::post('/expenses', [ReportController::class, 'storeExpense']);
    Route::put('/expenses/{id}', [ReportController::class, 'updateExpense']);
    Route::delete('/expenses/{id}', [ReportController::class, 'destroyExpense']);

    // Settings
    Route::put('/settings', [SettingController::class, 'update']);
});
