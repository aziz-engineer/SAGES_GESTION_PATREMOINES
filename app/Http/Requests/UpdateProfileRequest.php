<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;


class UpdateProfileRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $this->user()->id,
            'password' => 'sometimes|string|min:8|confirmed',
            'imageduprofile' => 'sometimes|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'numtelephone' => 'sometimes|string|max:20',
            'adresse' => 'sometimes|string|max:255',
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