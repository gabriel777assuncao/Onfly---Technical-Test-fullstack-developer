<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;

Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::post('register', 'register');
    Route::post('login', 'login');

    Route::middleware('auth:api')->group(function () {
        Route::get('me', 'me');
        Route::post('logout', 'logout');
        Route::post('refresh', 'refresh');
    });
});

Route::middleware('auth:api')
    ->prefix('travel-orders')
    ->controller(\App\Http\Controllers\Travel\TravelOrderController::class)
    ->group(function () {
        Route::post('/', 'store');
        Route::get('/', 'index');
        Route::get('{travel_order}', 'show');
        Route::patch('{travel_order}/status', 'updateStatus');
    });


