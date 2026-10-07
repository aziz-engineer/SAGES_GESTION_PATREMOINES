<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'num' => $this->num,
            'name' => $this->name,
            'date_debut' => $this->date_debut?->toDateString(),
            'duree_mois' => $this->duree_mois,
            'date_fin' => $this->date_fin?->toDateString(),
            'operation' => $this->operation,
            'objet' => $this->objet,
            'station' => $this->station,
            'loyer_fix_ht' => (string)$this->loyer_fix_ht,
            'augmentation_annuelle_pct' => (string)$this->augmentation_annuelle_pct,
            'loyer_variable_pct' => $this->loyer_variable_pct !== null ? (string)$this->loyer_variable_pct : null,
            'minimum_garanti_ttc' => $this->minimum_garanti_ttc !== null ? (string)$this->minimum_garanti_ttc : null,
            'minimum_garanti_note' => $this->minimum_garanti_note,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
