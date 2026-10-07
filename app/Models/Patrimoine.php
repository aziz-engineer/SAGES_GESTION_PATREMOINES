<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patrimoine extends Model
{
    use HasFactory;

    protected $fillable = [
        'station_id',
        'code_inventaire',
        'designation',
        'categorie',
        'marque',
        'modele',
        'numero_serie',
        'etat',
        'statut',
        'date_acquisition',
        'valeur_achat',
        'fournisseur',
        'garantie_fin',
        'prochaine_maintenance',
        'criticite',
        'responsable',
        'notes',
    ];

    protected $casts = [
        'garantie_fin' => 'date',
        'prochaine_maintenance' => 'date',
        'valeur_achat' => 'date',
    ];

    public function station()
    {
        return $this->belongsTo(Station::class);
    }
}
