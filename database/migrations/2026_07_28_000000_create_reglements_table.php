<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reglements', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('facture_id')->constrained('factures')->cascadeOnDelete();
            $table->foreignId('locataire_id')->constrained('locataires')->cascadeOnDelete();
            $table->foreignId('station_id')->constrained('stations')->cascadeOnDelete();

            // Identification
            $table->string('num_reglement')->unique();

            // Paiement
            $table->string('mode_paiement'); // ESPECES / CHEQUE / VIREMENT / TRAITE / CARTE
            $table->string('reference_paiement')->nullable(); // N° chèque / virement / traite
            $table->string('banque')->nullable();

            // Dates
            $table->date('date_reglement');
            $table->date('date_echeance')->nullable();

            // Montants (snapshot au moment de l'enregistrement)
            $table->decimal('montant_facture', 12, 3)->default(0);
            $table->decimal('montant_paye', 12, 3)->default(0);
            $table->decimal('montant_restant', 12, 3)->default(0);

            // Suivi de traitement (traité / non traité)
            $table->string('statut_traitement')->default('NON_TRAITE'); // NON_TRAITE / TRAITE
            $table->string('traite_par')->nullable();
            $table->timestamp('traite_le')->nullable();

            // Statut global du règlement
            $table->string('statut')->default('EN_ATTENTE'); // EN_ATTENTE / PARTIEL / VALIDE / REJETE / EN_RETARD

            $table->text('observation')->nullable();

            $table->timestamps();

            $table->index(['facture_id']);
            $table->index(['locataire_id']);
            $table->index(['station_id']);
            $table->index(['statut']);
            $table->index(['statut_traitement']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reglements');
    }
};
