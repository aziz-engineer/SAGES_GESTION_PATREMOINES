<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Insight extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'period',
        'impressions_tot',
        'reactions_like_total',
        'title',
        'description',
    ];

    protected $casts = [
        'values' => 'array',
    ];
}
