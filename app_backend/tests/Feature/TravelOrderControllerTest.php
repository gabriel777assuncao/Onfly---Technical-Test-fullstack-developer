<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\TravelOrder;
use App\TravelOrderStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class TravelOrderControllerTest extends FeatureTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_if_store_creates_order_as_owner_and_returns_resource(): void
    {
        $user = User::factory()->create();
        $payload = [
            'requester_name' => 'Ana Dev',
            'destination' => 'Belo Horizonte',
            'departure_date' => Carbon::today()->addDays(5)->toDateString(),
            'return_date' => Carbon::today()->addDays(10)->toDateString(),
        ];

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/travel-orders', $payload);

        $response->assertStatus(Response::HTTP_CREATED)
            ->assertJsonPath('message', __('messages.order.created'))
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'requester_name',
                    'destination',
                    'departure_date',
                    'return_date',
                    'status',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJsonPath('data.requester_name', 'Ana Dev')
            ->assertJsonPath('data.destination', 'Belo Horizonte')
            ->assertJsonPath('data.status', TravelOrderStatus::REQUESTED->value);

        $this->assertDatabaseHas('travel_orders', [
            'user_id' => $user->id,
            'requester_name' => 'Ana Dev',
            'destination' => 'Belo Horizonte',
            'status' => TravelOrderStatus::REQUESTED->value,
        ]);
    }

    public function test_if_store_returns_validation_error_if_status_is_sent(): void
    {
        $user = User::factory()->create();
        $payload = [
            'requester_name' => 'Ana',
            'destination' => 'SP',
            'departure_date' => Carbon::today()->addDay()->toDateString(),
            'return_date' => Carbon::today()->addDays(2)->toDateString(),
            'status' => TravelOrderStatus::APPROVED->value,
        ];

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/travel-orders', $payload);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_if_show_allows_owner_and_denies_non_owner(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create(['is_admin' => false]);

        $order = TravelOrder::factory()->for($owner)->create([
            'status' => TravelOrderStatus::REQUESTED->value,
            'requester_name' => 'Owner',
            'destination' => 'BH',
            'departure_date' => Carbon::today()->addDays(3),
            'return_date' => Carbon::today()->addDays(5),
        ]);

        $this->actingAs($owner, 'api')
            ->getJson("/api/travel-orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.destination', 'BH');

        $this->actingAs($intruder, 'api')
            ->getJson("/api/travel-orders/{$order->id}")
            ->assertStatus(Response::HTTP_FORBIDDEN);
    }

    public function test_if_show_allows_admin_to_view_foreign_order(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);

        $order = TravelOrder::factory()->for($owner)->create();

        $this->actingAs($admin, 'api')
            ->getJson("/api/travel-orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $order->id);
    }

    public function test_if_index_returns_only_own_orders_for_non_admin_with_pagination_and_resource_shape(): void
    {
        $user   = User::factory()->create();
        $other  = User::factory()->create();

        $mine   = TravelOrder::factory()->for($user)->count(3)->create();
        $others = TravelOrder::factory()->for($other)->count(2)->create();

        $response = $this->actingAs($user, 'api')
            ->getJson('/api/travel-orders?page[size]=2&page=1');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'requester_name',
                        'destination',
                        'departure_date',
                        'return_date',
                        'status',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'links' => ['first','last','prev','next'],
                'meta'  => ['current_page','from','last_page','path','per_page','to','total'],
            ])
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 2);

        $idsReturned = collect($response->json('data'))->pluck('id')->all();
        $this->assertCount(2, $idsReturned);
        $this->assertEmpty(array_intersect(
            $idsReturned,
            $others->pluck('id')->all()
        ));
    }

    public function test_if_index_returns_all_orders_for_admin_with_pagination(): void
    {
        $admin  = User::factory()->create(['is_admin' => true]);
        $u1     = User::factory()->create();
        $u2     = User::factory()->create();

        $o1 = TravelOrder::factory()->for($u1)->count(2)->create();
        $o2 = TravelOrder::factory()->for($u2)->count(2)->create();

        $response = $this->actingAs($admin, 'api')
            ->getJson('/api/travel-orders?page[size]=3&page=1');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id','requester_name','destination','departure_date','return_date','status','created_at','updated_at']],
                'links' => ['first','last','prev','next'],
                'meta'  => ['current_page','per_page','total'],
            ])
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 3);

        $userIds = collect($response->json('data'))->pluck('user_id');
        $this->assertEquals(4, TravelOrder::count());
        $this->assertEquals(4, $response->json('meta.total'));
    }

    public function test_if_update_status_is_forbidden_for_non_admin_by_route_policy(): void
    {
        $user  = User::factory()->create(['is_admin' => false]);
        $order = TravelOrder::factory()->for($user)->create([
            'status' => TravelOrderStatus::REQUESTED->value,
        ]);

        $payload = ['status' => TravelOrderStatus::APPROVED->value];

        $this->actingAs($user, 'api')
            ->patchJson("/api/travel-orders/{$order->id}/status", $payload)
            ->assertStatus(Response::HTTP_FORBIDDEN);
    }

    public function test_if_update_status_allows_admin_and_returns_resource_payload(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user  = User::factory()->create();
        $order = TravelOrder::factory()->for($user)->create([
            'status' => TravelOrderStatus::REQUESTED->value,
        ]);

        $payload = ['status' => TravelOrderStatus::APPROVED->value];

        $response = $this->actingAs($admin, 'api')
            ->patchJson("/api/travel-orders/{$order->id}/status", $payload);

        $response->assertOk()
            ->assertJsonPath('message', __('messages.updated', ['resource' => __('messages.resources.travel_order_status')]))
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'requester_name',
                    'destination',
                    'departure_date',
                    'return_date',
                    'status',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJsonPath('data.status', TravelOrderStatus::APPROVED->value);
    }
}
