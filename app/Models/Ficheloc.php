<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ficheloc extends Model
{
    protected $table = 'fichelocs';

    protected $fillable = [
        'locataire_id',
        'station_id',
        'adresse_facturation',
        'matricule_fiscale',
        'contact',
        'num_tel',
        'fax',
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
