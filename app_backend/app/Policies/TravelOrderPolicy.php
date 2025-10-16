<?php

namespace App\Policies;

use App\Models\{TravelOrder, User};

class TravelOrderPolicy
{
    public function approve(User $user): bool
    {
        return (bool) $user->is_admin;
    }

    public function view(User $user, TravelOrder $order): bool
    {
        return $order->user_id === $user->id || $user->is_admin;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }
}
