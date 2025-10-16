<?php

namespace Tests\Feature;

use Illuminate\Auth\Middleware\Authenticate;
use Tests\TestCase;

abstract class FeatureTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(Authenticate::class);

        config()->set('auth.defaults.guard', 'api');
        config()->set('auth.guards.api', [
            'driver' => 'jwt',
            'provider' => 'users',
        ]);
    }
}
