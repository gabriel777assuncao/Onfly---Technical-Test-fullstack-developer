<?php

namespace Database\Seeders;

use App\Models\{TravelOrder, User};
use Illuminate\Database\Seeder;

class TravelOrderSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.com')->first();
        $user = User::where('email', 'user@example.com')->first();

        if ($admin) {
            TravelOrder::factory()->count(5)->for($admin)->create();
        }

        if ($user) {
            TravelOrder::factory()->count(10)->for($user)->create();
        }
    }
}
