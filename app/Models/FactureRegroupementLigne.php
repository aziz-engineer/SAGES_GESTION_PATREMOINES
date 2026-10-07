<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FactureRegroupementLigne extends Model
{
    protected $table = 'facture_regroupement_lignes';

    protected $fillable = [
        'facture_regroupee_id',
        'facture_source_id',
    ];
}