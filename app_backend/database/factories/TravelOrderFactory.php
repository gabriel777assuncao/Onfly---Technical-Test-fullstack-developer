<?php

namespace Database\Factories;

use App\TravelOrderStatus;
use App\Models\TravelOrder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TravelOrderFactory extends Factory
{
    protected $model = TravelOrder::class;

    public function definition(): array
    {
        $departure = Carbon::now()->addDays(rand(1, 90));
        $return = $departure->copy()->addDays(rand(2, 10));

        return [
            'id' => (string)Str::uuid(),
            'user_id' => User::factory(),
            'requester_name' => $this->faker->name(),
            'destination' => $this->faker->city(),
            'departure_date' => $departure->format('Y-m-d'),
            'return_date' => $return->format('Y-m-d'),
            'status' => $this->faker->randomElement(TravelOrderStatus::values()),
        ];
    }
}
