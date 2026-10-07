<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'num' => ['required','integer','min:1'],
            'name' => ['required','string','max:255'],
            'date_debut' => ['required','date'],
            'duree_mois' => ['required','integer','min:1','max:600'],
            'date_fin' => ['nullable','date','after:date_debut'],
            'operation' => ['boolean'],
            'objet' => ['nullable','string','max:255'],
            'station' => ['nullable','string','max:255'],
            'loyer_fix_ht' => ['required','numeric','min:0'],
            'augmentation_annuelle_pct' => ['required','numeric','min:0','max:100'],
            'loyer_variable_pct' => ['nullable','numeric','min:0','max:100'],
            'minimum_garanti_ttc' => ['nullable','numeric','min:0'],
            'minimum_garanti_note' => ['nullable','string','max:255'],
        ];
    }
}
