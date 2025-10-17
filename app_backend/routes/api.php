<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Travel\TravelOrderController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\{JsonResponse, Request};

Route::get('ping', function (): JsonResponse {
    return response()->json('pong');
});

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
    ->controller(TravelOrderController::class)
    ->group(function (): void {
        Route::post('/', 'store');
        Route::get('/', 'index');
        Route::get('{travel_order}', 'show');
        Route::patch('{travel_order}/status', 'updateStatus');
    });
