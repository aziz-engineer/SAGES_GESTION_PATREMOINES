<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
     /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('postes', function (Blueprint $table) {
            $table->id();
            $table->string('statut')->nullable();
            $table->json('images')->nullable(); // Utiliser le type json pour stocker un tableau  d'images
            $table->json('videos')->nullable(); 
            $table->string('type')->nullable(); // Pour le type (publié, brouillon, plannifié)
         //   $table->date('date')->nullable(); // Pour la date (utilisée uniquement pour les posts plannifiés)
        
        
         $table->dateTime('date')->nullable();
         $table->unsignedBigInteger('user_id'); // Ajoutez cette ligne
         $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade'); // Ajoutez cette ligne aussi



            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('postes', function (Blueprint $table) {
            $table->dropForeign(['user_id']); // Ajoutez cette ligne
        });
        Schema::dropIfExists('postes');
    }
};
