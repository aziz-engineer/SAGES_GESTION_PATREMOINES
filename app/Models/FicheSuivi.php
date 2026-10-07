<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FicheSuivi extends Model
{
    protected $table = 'fiches_suivi';

    protected $fillable = [
        'tenant_id',
        'date',

        // tableau de types
        'types',

        // redevance fixe
        'montant_ht',
        'date_echeance',
        'date_paiement',

        // redevance variable
        'ca_ttc',
        'ca_taxable_ht',
        'ca_com_v_ht',
        'ca_date_echeance',
        'ca_date_paiement',

        // consommation électricité
        'elec_quantite',
        'elec_prix_total_ht',

        // gaz
        'gaz_quantite',
        'gaz_prix_total_ht',

        // eau
        'eau_quantite',
        'eau_prix_total_ht',
    ];

    protected $casts = [
        'types' => 'array', // transforme automatiquement JSON <-> tableau
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
