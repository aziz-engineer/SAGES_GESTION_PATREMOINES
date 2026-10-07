<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Poste;


/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Poste>
 */
class PosteFactory extends Factory
{
    protected $model = Poste::class;

    public function definition()
    {
        return [
            'statut' => $this->faker->sentence,
            'images' => json_encode([$this->faker->imageUrl]),
            'type' => $this->faker->randomElement(['publié', 'brouillon', 'planifié']),
            'date' => $this->faker->dateTime,
            'user_id' => \App\Models\User::factory(),
        ];
    }
}