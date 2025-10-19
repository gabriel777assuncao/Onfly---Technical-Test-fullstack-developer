<?php

namespace App\Http\Requests\Travel;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'requester_name' => ['required', 'string', 'max:255'],
            'destination' => ['required', 'string', 'max:255'],
            'departure_date' => ['required','date','date_format:Y-m-d','after_or_equal:today'],
            'return_date'    => ['required','date','date_format:Y-m-d','after:departure_date'],
            'status' => ['prohibited'],
        ];
    }
}
