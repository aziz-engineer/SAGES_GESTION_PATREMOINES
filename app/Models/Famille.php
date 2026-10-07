<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Famille extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'numero'
    ];

    public function sousfams()
    {
        return $this->hasMany(Sousfam::class);
    }
}
