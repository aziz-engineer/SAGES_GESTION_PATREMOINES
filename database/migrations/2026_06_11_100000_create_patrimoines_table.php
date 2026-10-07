<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patrimoines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')->constrained('stations')->cascadeOnDelete();
            $table->string('code_inventaire')->unique();
            $table->string('designation');
            $table->string('categorie');
            $table->string('marque')->nullable();
            $table->string('modele')->nullable();
            $table->string('numero_serie')->nullable();
            $table->string('etat');
            $table->string('statut');
            $table->date('date_acquisition')->nullable();
            $table->decimal('valeur_achat', 12, 2)->nullable();
            $table->string('fournisseur')->nullable();
            $table->date('garantie_fin')->nullable();
            $table->date('prochaine_maintenance')->nullable();
            $table->string('criticite');
            $table->string('responsable')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patrimoines');
    }
};
