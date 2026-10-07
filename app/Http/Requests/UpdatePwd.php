<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;


class UpdatePwd extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        return [
            'current_password' => 'required|string',
            'new_password' => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers()->symbols()
            ],
        ];
    }

    public function messages()
    {
        return [
            'current_password.required' => 'Le mot de passe actuel est requis.',
            'new_password.required' => 'Le nouveau mot de passe est requis.',
            'new_password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
        ];
    }
}