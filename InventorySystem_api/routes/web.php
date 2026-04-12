<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (! auth()->check()) {
        return redirect('/login');
    }

    return redirect(auth()->user()->role === 'viewer' ? '/viewer' : '/admin');
});

Route::get('/login', [AuthController::class, 'create'])->name('login');
Route::post('/login', [AuthController::class, 'store']);

Route::middleware('auth.session')->group(function () {
    Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');

    Route::middleware('role:admin')->get('/admin', function () {
        return view('app');
    });

    Route::middleware('role:viewer')->get('/viewer', function () {
        return view('viewer');
    });
});
