<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sousfam extends Model
{
    use HasFactory;

    protected $fillable = [
        'famille_id',
        'nom',
        'numero'
    ];

    public function famille()
    {
        return $this->belongsTo(Famille::class);
    }
}
