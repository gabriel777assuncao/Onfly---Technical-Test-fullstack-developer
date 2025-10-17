<?php

namespace Tests\Unit;

use App\Models\TravelOrder;
use App\Services\TravelOrderStatusServices;
use App\TravelOrderStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Feature\FeatureTestCase;

class TravelOrderStatusServiceTest extends FeatureTestCase
{
    use RefreshDatabase;

    private TravelOrderStatusServices $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TravelOrderStatusServices();
    }

    public function test_if_it_approves_a_requested_order(): void
    {
        $order = TravelOrder::factory()->create([
            'status' => TravelOrderStatus::REQUESTED->value,
        ]);

        $updated = $this->service->change($order, TravelOrderStatus::APPROVED);

        $this->assertSame(TravelOrderStatus::APPROVED->value, $updated->status->value ?? $updated->status);
        $this->assertDatabaseHas('travel_orders', [
            'id' => $order->id,
            'status' => TravelOrderStatus::APPROVED->value,
        ]);
    }

    public function test_if_it_cancels_a_requested_order(): void
    {
        $order = TravelOrder::factory()->create([
            'status' => TravelOrderStatus::REQUESTED->value,
        ]);

        $updated = $this->service->change($order, TravelOrderStatus::CANCELED);

        $this->assertSame(TravelOrderStatus::CANCELED->value, $updated->status->value ?? $updated->status);
        $this->assertDatabaseHas('travel_orders', [
            'id' => $order->id,
            'status' => TravelOrderStatus::CANCELED->value,
        ]);
    }

    public function test_if_it_is_idempotent_when_new_status_equals_current(): void
    {
        $order = TravelOrder::factory()->create([
            'status' => TravelOrderStatus::APPROVED->value,
        ]);

        $updated = $this->service->change($order, TravelOrderStatus::APPROVED);

        $this->assertSame($order->id, $updated->id);
        $this->assertSame(TravelOrderStatus::APPROVED->value, $updated->status->value ?? $updated->status);
        $this->assertDatabaseHas('travel_orders', [
            'id' => $order->id,
            'status' => TravelOrderStatus::APPROVED->value,
        ]);
    }

    public function test_if_it_throws_validation_exception_when_trying_to_cancel_an_approved_order(): void
    {
        $order = TravelOrder::factory()->create([
            'status' => TravelOrderStatus::APPROVED->value,
        ]);

        try {
            $this->service->change($order, TravelOrderStatus::CANCELED);
            $this->fail('Expected ValidationException was not thrown.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('status', $error->errors());
            $this->assertNotEmpty($error->errors()['status']);
            $this->assertStringContainsString(
                __('messages.travel_order.transition.not_allowed_after_approved'),
                (string) $error->errors()['status'][0]
            );
        }

        $this->assertDatabaseHas('travel_orders', [
            'id' => $order->id,
            'status' => TravelOrderStatus::APPROVED->value,
        ]);
    }

    public function test_if_it_detects_concurrency_and_throws_validation_exception(): void
    {
        $order = TravelOrder::factory()->create([
            'status' => TravelOrderStatus::REQUESTED->value,
        ]);

        TravelOrder::whereKey($order->getKey())
            ->update(['status' => TravelOrderStatus::APPROVED->value]);

        try {
            $this->service->change($order->refresh(), TravelOrderStatus::CANCELED);
            $this->fail('Expected ValidationException due to concurrency was not thrown.');
        } catch (ValidationException $error) {
            $this->assertArrayHasKey('status', $error->errors());
            $this->assertStringContainsString(
                __('messages.travel_order.transition.not_allowed_after_approved'),
                (string) $error->errors()['status'][0]
            );
        }

        $this->assertDatabaseHas('travel_orders', [
            'id' => $order->id,
            'status' => TravelOrderStatus::APPROVED->value,
        ]);
    }
}
