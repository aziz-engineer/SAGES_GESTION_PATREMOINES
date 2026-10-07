<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User ;

class Post extends Model
{
    protected $table = 'posts'; 

    protected $fillable = [
        'user_id', // Ajoutez cette ligne
        'page_id','social_id', 'message', 'media_path','media_paths', 'post_id','access_token', 'Programming_options', 'scheduledDateTime'];

    protected $casts = [
        'media_paths' => 'json', // Convertir le champ media_paths en JSON lors de la lecture/écriture   
    ];
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
