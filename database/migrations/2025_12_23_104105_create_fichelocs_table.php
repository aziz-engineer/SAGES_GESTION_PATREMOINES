<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fichelocs', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('locataire_id')
                  ->constrained('locataires')
                  ->cascadeOnDelete();

            $table->foreignId('station_id')
                  ->constrained('stations')
                  ->cascadeOnDelete();

            // Champs métier
            $table->string('adresse_facturation')->nullable();
            $table->string('matricule_fiscale'); // OBLIGATOIRE
            $table->string('contact')->nullable();
            $table->string('num_tel')->nullable();
            $table->string('fax')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fichelocs');
    }
};
