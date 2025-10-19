<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'email' => [
                'bail',
                'required',
                'email',
                Rule::unique('users', 'email'),
            ],
            'username' => [
                'bail',
                'required',
                'min:3',
                'max:255',
                Rule::unique('users', 'username'),
            ],
            'name' => 'required|min:3|max:255',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => $this->email ? mb_strtolower(trim($this->email)) : null,
            'username' => $this->username ? trim($this->username) : null,
            'name' => $this->name ? trim($this->name) : null,
        ]);
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'E-mail já cadastrado.',
            'username.unique' => 'Usuário já cadastrado.',
        ];
    }
}
