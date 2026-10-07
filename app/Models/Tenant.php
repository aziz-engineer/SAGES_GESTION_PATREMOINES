<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'num','name','date_debut','duree_mois','date_fin','operation',
        'objet','station','loyer_fix_ht','augmentation_annuelle_pct',
        'loyer_variable_pct','minimum_garanti_ttc','minimum_garanti_note',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'operation' => 'boolean',
        'loyer_fix_ht' => 'decimal:3',
        'augmentation_annuelle_pct' => 'decimal:2',
        'loyer_variable_pct' => 'decimal:2',
        'minimum_garanti_ttc' => 'decimal:3',
    ];

    // Si date_fin est absente, la calculer à partir de date_debut + duree_mois
    protected static function booted(): void
    {
        static::saving(function (Tenant $t) {
            if (empty($t->date_fin) && !empty($t->date_debut) && !empty($t->duree_mois)) {
                $t->date_fin = CarbonImmutable::parse($t->date_debut)->addMonths($t->duree_mois);
            }
        });
    }
}
