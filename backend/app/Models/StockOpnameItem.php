<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_opname_id',
        'ingredient_id',
        'system_stock',
        'physical_stock',
        'discrepancy',
        'discrepancy_cost',
        'reason',
    ];

    protected $casts = [
        'system_stock' => 'float',
        'physical_stock' => 'float',
        'discrepancy' => 'float',
        'discrepancy_cost' => 'float',
    ];

    public function stockOpname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
