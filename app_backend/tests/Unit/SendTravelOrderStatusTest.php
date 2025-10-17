<?php

namespace Tests\Unit\Jobs;

use App\Jobs\SendTravelOrderStatus;
use App\Models\TravelOrder;
use App\Models\User;
use App\Notifications\TravelOrderStatusChangedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SendTravelOrderStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_if_it_queues_the_job_with_correct_payload(): void
    {
        Queue::fake();

        $user  = User::factory()->create();
        $order = TravelOrder::factory()->for($user)->create([
            'destination' => 'Belo Horizonte',
            'status' => 'requested',
        ]);

        SendTravelOrderStatus::dispatch($order, 'requested', 'approved');

        Queue::assertPushed(SendTravelOrderStatus::class, fn(SendTravelOrderStatus $job) => $job->order->is($order)
            && $job->oldStatus === 'requested'
            && $job->newStatus === 'approved');
    }

    public function test_if_it_sends_notification_when_job_handles(): void
    {
        Notification::fake();

        $user = User::factory()->create(['name' => 'João']);
        $order = TravelOrder::factory()->for($user)->create([
            'destination' => 'Belo Horizonte',
            'status' => 'requested',
        ]);

        new SendTravelOrderStatus($order, 'requested', 'approved')->handle();

        Notification::assertSentTo(
            $user,
            TravelOrderStatusChangedNotification::class,
            function (TravelOrderStatusChangedNotification $notification, array $channels) use ($order) {
                $this->assertContains('mail', $channels);

                $this->assertTrue($notification->order->is($order));
                $this->assertSame('requested', $notification->oldStatus);
                $this->assertSame('approved',  $notification->newStatus);

                return true;
            }
        );
    }
}
