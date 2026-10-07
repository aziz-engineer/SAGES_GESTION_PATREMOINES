<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Locataire extends Model
{
    use HasFactory;

    // Tu as demandé un nom de table singulier 'locataire'
    protected $table = 'locataire';

    protected $fillable = [
        'numero',
        'locataire',
        'date_debut',
        'duree',
        'date_fin',
        'operationnel',
        'objet',
        'station',
        'loyer_fix_mois_ht',
        'augmentation_annuelle',
        'loyer_variable',
    ];

    protected $casts = [
        'date_debut'            => 'date',
        'date_fin'              => 'date',
        'operationnel'          => 'boolean',
        'loyer_fix_mois_ht'     => 'decimal:3',
        'augmentation_annuelle' => 'decimal:4',
    ];
}
