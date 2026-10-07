<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    protected $fillable = [
        'contrat_id','locataire_id','station_id',
        'mois','annee','date_facture',
        'facture_code','facture_suffix','facture_code_full',
        'variable_ttc',
        'loyer_fixe_ht','redevance_htva','redevance_ttc',
        'electricite_ht','eau_ht','gaz_ht','personnel_ht',
        'charge_complementaire_ht','charge_complementaire_comment',
        'total_htva','tva_19','timber','total_ttc',
        'status',
        'type_facture',
        'parent_regroupement_id',
        'periode_debut',
        'periode_fin',
    ];

    public function lignes()
    {
        return $this->hasMany(FactureLigne::class);
    }

    public function contrat()
    {
        return $this->belongsTo(Contrat::class);
    }

    public function locataire()
    {
        return $this->belongsTo(Locataires::class);
    }

    public function station()
    {
        return $this->belongsTo(Station::class);
    }

    public function factureParent()
    {
        return $this->belongsTo(Facture::class, 'parent_regroupement_id');
    }

    public function facturesSources()
    {
        return $this->belongsToMany(
            Facture::class,
            'facture_regroupement_lignes',
            'facture_regroupee_id',
            'facture_source_id'
        );
    }
}
