<?php

namespace App;

enum TravelOrderStatus: string
{
    case REQUESTED = 'requested';
    case APPROVED = 'approved';
    case CANCELED = 'canceled';

    public function canTransitionTo(self $to): bool
    {
        return match ($this) {
            self::REQUESTED => in_array($to, [self::APPROVED, self::CANCELED], true),
            self::APPROVED, self::CANCELED => false,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::REQUESTED => 'Requested',
            self::APPROVED => 'Approved',
            self::CANCELED => 'Canceled',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
