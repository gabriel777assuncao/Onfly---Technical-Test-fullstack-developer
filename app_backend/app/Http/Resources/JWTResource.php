<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JWTResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'token' => data_get($this->resource, 'token'),
            'token_type' => 'Bearer',
            'expires_in' => data_get($this->resource, 'expires_in'),
            'expires_at' => data_get($this->resource, 'expires_at'),
        ];
    }
}
