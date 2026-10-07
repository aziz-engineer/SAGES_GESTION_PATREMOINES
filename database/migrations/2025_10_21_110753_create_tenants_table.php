<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('num')->index();                 // N°
            $table->string('name');                                   // Locataire
            $table->date('date_debut');                               // Date début
            $table->unsignedInteger('duree_mois');                    // Durée (mois)
            $table->date('date_fin')->nullable();                     // Date fin (auto si null)
            $table->boolean('operation')->default(true);              // OUI/NON
            $table->string('objet')->nullable();                      // Objet
            $table->string('station')->nullable();                    // Station
            $table->decimal('loyer_fix_ht', 15, 3)->default(0);       // Loyer fixe HT / mois
            $table->decimal('augmentation_annuelle_pct', 5, 2)->default(0); // % augmentation/an
            $table->decimal('loyer_variable_pct', 5, 2)->nullable();  // % de CA
            $table->decimal('minimum_garanti_ttc', 15, 3)->nullable();// Minimum garanti TTC
            $table->string('minimum_garanti_note')->nullable();       // Note MG
            $table->timestamps();

            $table->unique(['num', 'name']); // utile si le N° est par locataire
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
