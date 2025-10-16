<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Lang;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Auth\Middleware\Authenticate;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(Authenticate::class);

        config()->set('auth.defaults.guard', 'api');
        config()->set('auth.guards.api', [
            'driver'   => 'jwt',
            'provider' => 'users',
        ]);
    }

    public function test_register_creates_user_and_returns_resource(): void
    {
        $requestPayload = [
            'name' => 'Ana Dev',
            'username' => 'anadev',
            'email' => 'ana@example.com',
            'password' => 'StrongP@ssw0rd',
        ];

        $response = $this->postJson('/api/auth/register', $requestPayload);

        $response
            ->assertStatus(Response::HTTP_CREATED)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'username',
                    'email',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJsonPath('user.email', 'ana@example.com')
            ->assertJsonPath('user.username', 'anadev')
            ->assertJsonPath('user.name', 'Ana Dev')
            ->assertJsonMissingPath('user.password');

        $this->assertDatabaseHas('users', [
            'email' => 'ana@example.com',
            'username' => 'anadev',
            'name' => 'Ana Dev',
        ]);
    }

    public function test_login_returns_token_on_valid_credentials(): void
    {
        $this->partialMock(Guard::class, function ($mock) {
            $mock->shouldReceive('attempt')
                ->once()
                ->andReturn('token-123');
        });

        JWTAuth::partialMock()
            ->shouldReceive('factory->getTTL')
            ->once()
            ->andReturn(60);

        $payload = [
            'email' => 'ana@example.com',
            'password' => 'StrongP@ssw0rd',
        ];

        $response = $this->postJson('/api/auth/login', $payload);

        $response->assertStatus(Response::HTTP_OK)
            ->assertJsonStructure(['token', 'token_type', 'expires_in', 'expires_at'])
            ->assertJsonPath('token', 'token-123')
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('expires_in', 3600);
    }

    public function test_login_returns_unauthorized_on_invalid_credentials(): void
    {
        $this->partialMock(Guard::class, function ($mock) {
            $mock->shouldReceive('attempt')
                ->once()
                ->andReturn(false);
        });

        $payload = [
            'email' => 'ana@example.com',
            'password' => 'wrongcredentialss',
        ];

        $response = $this->postJson('/api/auth/login', $payload);

        $response->assertStatus(401)
            ->assertJsonPath('message', __('auth.unauthorized'));
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create([
            'name' => 'Ana',
            'email' => 'ana@example.com',
        ]);

        $this->partialMock(Guard::class, function ($mock) use ($user) {
            $mock->shouldReceive('user')
                ->once()
                ->andReturn($user);
        });

        $response = $this->getJson('/api/auth/me');

        $response->assertOk()
            ->assertJsonPath('message', __('auth.me'))
            ->assertJsonPath('user.email', 'ana@example.com')
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'created_at',
                    'updated_at',
                ],
            ]);
    }

    public function test_refresh_returns_new_token(): void
    {
        $this->partialMock(Guard::class, function ($mock) {
            $mock->shouldReceive('refresh')
                ->once()
                ->andReturn('new-token-xyz');
        });

        JWTAuth::partialMock()
            ->shouldReceive('factory->getTTL')
            ->once()
            ->andReturn(15);

        $response = $this->postJson('/api/auth/refresh');

        $response->assertOk()
            ->assertJsonPath('token', 'new-token-xyz')
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonPath('expires_in', 900)
            ->assertJsonStructure(['expires_at']);
    }

    public function test_logout_invalidates_token(): void
    {
        $this->partialMock(Guard::class, function ($mock) {
            $mock->shouldReceive('logout')->once();
        });

        $response = $this->postJson('/api/auth/logout');

        $response->assertOk()
            ->assertJsonPath('message', __('auth.logged_out'));
    }
}
