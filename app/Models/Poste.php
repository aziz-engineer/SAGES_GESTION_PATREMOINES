<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User ;


class Poste extends Model
{
    use HasFactory;
    protected $casts = [
        'images' => 'json','videos' => 'json'

    ];

    protected $fillable = [
        'user_id', // Ajoutez cette ligne

        'statut', 'images','videos','type', 'date'
    ];



    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
