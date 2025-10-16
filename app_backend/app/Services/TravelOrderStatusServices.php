<?php

namespace App\Services;

use App\TravelOrderStatus;
use App\Models\TravelOrder;
use Illuminate\Validation\ValidationException;

class TravelOrderStatusServices
{
    public function change(TravelOrder $order, TravelOrderStatus $to): TravelOrder
    {
        $from = $order->status;

        if ($from === $to) {
            return $order;
        }

        if (!$from->canTransitionTo($to)) {
            $msg = ($from === TravelOrderStatus::APPROVED && $to === TravelOrderStatus::CANCELED)
                ? __('messages.travel_order.transition.not_allowed_after_approved')
                : __('messages.travel_order.transition.invalid', [
                    'from' => $from->label(),
                    'to'   => $to->label(),
                ]);

            throw ValidationException::withMessages(['status' => $msg]);
        }

        $updated = TravelOrder::query()
            ->whereKey($order->getKey())
            ->where('status', $from->value)
            ->update(['status' => $to->value]);

        if ($updated === 0) {
            throw ValidationException::withMessages([
                'status' => __('messages.travel_order.transition.concurrency'),
            ]);
        }

        return $order->refresh();
    }
}
