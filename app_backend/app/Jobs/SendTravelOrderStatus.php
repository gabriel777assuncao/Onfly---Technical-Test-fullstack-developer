<?php

namespace App\Jobs;

use App\Models\TravelOrder;
use App\Notifications\TravelOrderStatusChangedNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendTravelOrderStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public TravelOrder $order,
        public string $from,
        public string $to,
    ) {
//        dd('ta vindo no job');
    }

    public function handle(): void
    {
//        dd('ta vindo no job');
        $user = $this->order->user;
        $user->notify(new TravelOrderStatusChangedNotification($this->order, $this->from, $this->to));
    }
}
