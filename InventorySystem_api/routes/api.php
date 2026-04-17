<?php

use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth.session'])->group(function () {
    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/report', [ProductController::class, 'report'])->name('products.report');
    Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');
    Route::get('purchases', [ProductController::class, 'purchases'])->name('products.purchases');
    Route::post('products/{product}/purchase', [ProductController::class, 'purchase'])->middleware('role:viewer')->name('products.purchase');

    Route::middleware(['role:admin', 'admin.port'])->group(function () {
        Route::post('products', [ProductController::class, 'store'])->name('products.store');
        Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::patch('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
    });
});
