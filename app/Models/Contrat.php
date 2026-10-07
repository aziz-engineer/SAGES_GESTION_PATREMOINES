<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contrat extends Model
{
    protected $fillable = [
        'locataire_id',
        'station_id',
        'date_debut',
        'duree',
        'date_fin',
        'objet',
        'loyer_fix_ht',
        'augmentation_annuelle',
        'loyer_variable',
        'minimum_garantie',
    ];

    // Relations
    public function locataire()
    {
        return $this->belongsTo(Locataires::class);
    }

    public function station()
    {
        return $this->belongsTo(Station::class);
    }
}
