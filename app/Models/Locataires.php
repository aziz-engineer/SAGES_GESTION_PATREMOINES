<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Locataires extends Model
{
    protected $table = 'locataires';

    protected $fillable = [
        'nom',
        'num'
    ];
    public function contrats()
{
    return $this->hasMany(Contrat::class);
}
public function fichelocs()
{
    return $this->hasMany(Ficheloc::class, 'locataire_id');
}


}
