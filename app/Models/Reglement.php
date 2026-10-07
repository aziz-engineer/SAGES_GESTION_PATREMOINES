<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reglement extends Model
{
    protected $fillable = [
        'facture_id',
        'locataire_id',
        'station_id',
        'num_reglement',
        'mode_paiement',
        'reference_paiement',
        'banque',
        'date_reglement',
        'date_echeance',
        'montant_facture',
        'montant_paye',
        'montant_restant',
        'statut_traitement',
        'traite_par',
        'traite_le',
        'statut',
        'observation',
    ];

    protected $casts = [
        'date_reglement' => 'date',
        'date_echeance' => 'date',
        'traite_le' => 'datetime',
        'montant_facture' => 'decimal:3',
        'montant_paye' => 'decimal:3',
        'montant_restant' => 'decimal:3',
    ];

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }

    public function locataire()
    {
        return $this->belongsTo(Locataires::class, 'locataire_id');
    }

    public function station()
    {
        return $this->belongsTo(Station::class);
    }
}
