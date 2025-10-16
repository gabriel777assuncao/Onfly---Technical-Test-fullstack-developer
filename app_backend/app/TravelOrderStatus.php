<?php

namespace App;

enum TravelOrderStatus: string
{
    case REQUESTED = 'requested';
    case APPROVED  = 'approved';
    case CANCELED  = 'canceled';

    public function label(): string
    {
        return match($this) {
            self::REQUESTED => 'Solicitado',
            self::APPROVED  => 'Aprovado',
            self::CANCELED  => 'Cancelado',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
