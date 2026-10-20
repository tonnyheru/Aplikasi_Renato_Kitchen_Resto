<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'ingredient_id',
        'movement_type',
        'quantity',
        'cost_per_unit',
        'reference_type',
        'reference_id',
        'reason',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'float',
        'cost_per_unit' => 'float',
    ];

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
