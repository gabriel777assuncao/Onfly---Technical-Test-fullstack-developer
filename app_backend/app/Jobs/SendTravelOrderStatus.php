<?php

namespace App\Jobs;

use App\Models\TravelOrder;
use App\Notifications\TravelOrderStatusChangedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\{InteractsWithQueue, SerializesModels};

class SendTravelOrderStatus implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public TravelOrder $order,
        public string $oldStatus,
        public string $newStatus,
    ) {
    }

    public function handle(): void
    {
        $user = $this->order->user;
        $user->notify(new TravelOrderStatusChangedNotification($this->order, $this->oldStatus, $this->newStatus));
    }
}
