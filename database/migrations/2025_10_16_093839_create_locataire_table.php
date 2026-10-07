<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('locataire', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('numero')->nullable();                  // N°
            $table->string('locataire');                                     // LOCATAIRE
            $table->date('date_debut')->nullable();                          // DATE
            $table->string('duree')->nullable();                             // DUREE (ex: "05 Ans" ou "RESILIATION")
            $table->date('date_fin')->nullable();                            // DATE FIN
            $table->boolean('operationnel')->default(false);                 // OPERATIONNEL (OUI/NON)
            $table->string('objet')->nullable();                             // OBJET
            $table->string('station')->nullable();                           // STATION
            $table->decimal('loyer_fix_mois_ht', 12, 3)->nullable();         // Loyer Fix/Mois HT
            $table->decimal('augmentation_annuelle', 6, 4)->nullable();      // 0.05 = 5%
            $table->string('loyer_variable')->nullable();                    // "10% de CA", etc.
            $table->timestamps();

            $table->index(['numero', 'locataire', 'station']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locataire');
    }
};
