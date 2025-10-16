<?php

namespace App\Http\Requests\Travel;

use App\TravelOrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in([
                    TravelOrderStatus::APPROVED->value,
                    TravelOrderStatus::CANCELED->value,
                ]),
            ],
        ];
    }
}
