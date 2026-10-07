<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Station extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'numero'
    ];

    public function contrats()
    {
        return $this->hasMany(Contrat::class);
    }

    public function patrimoines()
    {
        return $this->hasMany(Patrimoine::class);
    }
}
