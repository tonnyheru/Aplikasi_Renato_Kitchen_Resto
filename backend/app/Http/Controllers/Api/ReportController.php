<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Expense;
use App\Models\Ingredient;
use App\Models\Payment;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function dashboard(Request $request)
    {
        $period = $request->query('period', 'today'); // today, yesterday, 7days, month
        
        $startDate = match ($period) {
            'yesterday' => now()->subDay()->startOfDay(),
            '7days' => now()->subDays(7)->startOfDay(),
            'month' => now()->startOfMonth(),
            default => now()->startOfDay(),
        };

        $endDate = match ($period) {
            'yesterday' => now()->subDay()->endOfDay(),
            default => now()->endOfDay(),
        };

        // Paid orders in period
        $paidOrders = Order::where('payment_status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate]);

        $totalRevenue = (float) $paidOrders->sum('total_amount');
        $totalOrdersCount = $paidOrders->count();
        $averageOrderValue = $totalOrdersCount > 0 ? round($totalRevenue / $totalOrdersCount, 2) : 0;

        // COGS (HPP) calculation from order items snapshot
        $paidOrderIds = (clone $paidOrders)->pluck('id');
        $cogs = (float) OrderItem::whereIn('order_id', $paidOrderIds)
            ->selectRaw('SUM(cost_price * quantity) as total_cogs')
            ->value('total_cogs') ?? 0;

        $grossProfit = max(0, $totalRevenue - $cogs);

        // Operational Expenses in period
        $totalExpenses = (float) Expense::whereBetween('expense_date', [
            $startDate->toDateString(),
            $endDate->toDateString()
        ])->sum('amount');

        // Top Selling Products
        $topProducts = OrderItem::whereIn('order_id', $paidOrderIds)
            ->select('product_name', DB::raw('SUM(quantity) as total_qty'), DB::raw('SUM(subtotal) as total_sales'))
            ->groupBy('product_name')
            ->orderByDesc('total_qty')
            ->take(5)
            ->get();

        // Low stock count
        $lowStockIngredients = Ingredient::whereColumn('current_stock', '<=', 'min_stock')
            ->take(5)
            ->get();

        // Payment Method breakdown
        $paymentBreakdown = Payment::whereHas('order', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate])->where('payment_status', 'paid');
        })
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount_paid) as total'))
            ->groupBy('payment_method')
            ->get();

        // Active Orders in Kitchen
        $activeKitchenCount = Order::whereIn('order_status', ['confirmed', 'preparing', 'ready'])->count();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => $period,
                'metrics' => [
                    'revenue' => $totalRevenue,
                    'transaction_count' => $totalOrdersCount,
                    'average_order_value' => $averageOrderValue,
                    'cogs' => $cogs,
                    'gross_profit' => $grossProfit,
                    'expenses' => $totalExpenses,
                    'active_kitchen_orders' => $activeKitchenCount,
                ],
                'top_products' => $topProducts,
                'low_stock_items' => $lowStockIngredients,
                'payment_breakdown' => $paymentBreakdown,
            ],
        ]);
    }

    public function expenses(Request $request)
    {
        $expenses = Expense::with('user')->orderBy('expense_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $expenses,
        ]);
    }

    public function storeExpense(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string',
            'description' => 'required|string',
            'amount' => 'required|numeric|min:1',
            'expense_date' => 'required|date',
        ]);

        $expenseNumber = 'EXP-' . now()->format('Ymd') . '-' . sprintf('%03d', Expense::whereDate('created_at', now()->toDateString())->count() + 1);

        $expense = Expense::create([
            'expense_number' => $expenseNumber,
            'category' => $validated['category'],
            'description' => $validated['description'],
            'amount' => $validated['amount'],
            'expense_date' => $validated['expense_date'],
            'user_id' => $request->user() ? $request->user()->id : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengeluaran operasional berhasil dicatat.',
            'data' => $expense,
        ], 201);
    }

    public function updateExpense(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'category' => 'required|string',
            'description' => 'required|string',
            'amount' => 'required|numeric|min:1',
            'expense_date' => 'required|date',
        ]);

        $expense->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data pengeluaran berhasil diperbarui.',
            'data' => $expense->fresh(['user']),
        ]);
    }

    public function destroyExpense($id)
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pengeluaran berhasil dihapus.',
        ]);
    }
}

