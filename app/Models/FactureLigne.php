<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FactureLigne extends Model
{
    protected $table = 'facture_lignes';

    protected $fillable = [
        'facture_id',
        'type',
        'libelle',
        'montant_htva',
    ];

    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }
}
