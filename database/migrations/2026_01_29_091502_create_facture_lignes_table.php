<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('facture_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();

            // Exemple: FIXE, VARIABLE, ELECTRICITE, EAU, GAZ, PERSONNEL, CHARGE_COMP
            $table->string('type', 40);

            // Libellé affichable: "Charge complémentaire (poubelle) HTVA"
            $table->string('libelle');

            // Montant HTVA de la ligne
            $table->decimal('montant_htva', 12, 3)->default(0);

            $table->timestamps();

            $table->index(['facture_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture_lignes');
    }
};
