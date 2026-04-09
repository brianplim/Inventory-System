<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'category',
        'price',
        'quantity',
        'date_added',
        'description',
        'image_path',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'date_added' => 'date',
    ];
}
