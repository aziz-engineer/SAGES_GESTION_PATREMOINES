<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'num' => ['sometimes','integer','min:1'],
            'name' => ['sometimes','string','max:255'],
            'date_debut' => ['sometimes','date'],
            'duree_mois' => ['sometimes','integer','min:1','max:600'],
            'date_fin' => ['nullable','date','after:date_debut'],
            'operation' => ['sometimes','boolean'],
            'objet' => ['sometimes','nullable','string','max:255'],
            'station' => ['sometimes','nullable','string','max:255'],
            'loyer_fix_ht' => ['sometimes','numeric','min:0'],
            'augmentation_annuelle_pct' => ['sometimes','numeric','min:0','max:100'],
            'loyer_variable_pct' => ['sometimes','nullable','numeric','min:0','max:100'],
            'minimum_garanti_ttc' => ['sometimes','nullable','numeric','min:0'],
            'minimum_garanti_note' => ['sometimes','nullable','string','max:255'],
        ];
    }
}
