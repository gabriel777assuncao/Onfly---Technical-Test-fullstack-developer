<?php

namespace App\Models;

use App\TravelOrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TravelOrder extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'requester_name',
        'destination',
        'departure_date',
        'return_date',
        'status',
        'user_id',
    ];

    protected $casts = [
        'departure_date' => 'date',
        'return_date' => 'date',
        'status' => TravelOrderStatus::class,
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (! $model->id) {
                $shortId = substr(Str::uuid()->toString(), 0, 7);
                $model->id = 'TRV-' . strtoupper($shortId);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
