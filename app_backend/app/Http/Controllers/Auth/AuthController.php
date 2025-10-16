<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Support\Arr;
use App\Http\Requests\Auth\{LoginRequest, RegisterRequest};
use App\Http\Resources\{JWTResource, UserResource};
use App\Models\User;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    private const string BEARER = 'Bearer';

    private const string PASSWORD = 'password';

    public function __construct(
        private readonly User $users,
        private readonly Guard $auth,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (Arr::has($data, self::PASSWORD)) {
            $data['password'] = Hash::make($data['password']);
        }

        $user = $this->users->create($data);

        return response()->json(
            [
                'message' => __('auth.created'),
                'user' => UserResource::make($user),
            ],
            Response::HTTP_CREATED,
        );
    }

    public function me(): JsonResponse
    {
        return response()->json([
            'message' => __('auth.me'),
            'user' => UserResource::make($this->auth->user()),
        ]);
    }

    public function logout(): JsonResponse
    {
        $this->auth->logout();

        return response()->json(['message' => __('auth.logged_out')]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! $token = $this->auth->attempt($credentials)) {
            return response()->json(['message' => __('auth.unauthorized')], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json(JWTResource::make($this->tokenPayload($token)));
    }

    public function refresh(): JsonResponse
    {
        $newToken = $this->auth->refresh();

        return response()->json(JWTResource::make($this->tokenPayload($newToken)));
    }

    private function tokenPayload(string $token): array
    {
        $ttlMinutes = JWTAuth::factory()->getTTL();
        $expiresAt  = now()->addMinutes($ttlMinutes)->toIso8601String();

        return [
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $ttlMinutes * 60,
            'expires_at' => $expiresAt,
        ];
    }
}
