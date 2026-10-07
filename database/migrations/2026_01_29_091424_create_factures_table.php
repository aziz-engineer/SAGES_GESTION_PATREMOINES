<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->foreignId('locataire_id')->constrained('locataires')->cascadeOnDelete();
            $table->foreignId('station_id')->constrained('stations')->cascadeOnDelete();

            // Période
            $table->unsignedTinyInteger('mois');
            $table->unsignedSmallInteger('annee');
            $table->date('date_facture');

            // Codes
            $table->string('facture_code')->unique(); // ex: 10201052026
            $table->string('facture_suffix')->nullable(); // ex: FVD
            $table->string('facture_code_full')->nullable(); // ex: 10201052026 FVD

            // Inputs (pour audit)
            $table->decimal('variable_ttc', 12, 3)->default(0);

            // Montants calculés (snapshot)
            $table->decimal('loyer_fixe_ht', 12, 3)->default(0);
            $table->decimal('redevance_htva', 12, 3)->default(0);
            $table->decimal('redevance_ttc', 12, 3)->default(0);

            $table->decimal('electricite_ht', 12, 3)->default(0);
            $table->decimal('eau_ht', 12, 3)->default(0);
            $table->decimal('gaz_ht', 12, 3)->default(0);
            $table->decimal('personnel_ht', 12, 3)->default(0);

            $table->decimal('charge_complementaire_ht', 12, 3)->default(0);
            $table->string('charge_complementaire_comment')->nullable();

            // Totaux
            $table->decimal('total_htva', 12, 3)->default(0);
            $table->decimal('tva_19', 12, 3)->default(0);
            $table->decimal('timber', 12, 3)->default(1);
            $table->decimal('total_ttc', 12, 3)->default(0);

            // Optionnel: statut
            $table->string('status')->default('EMISE'); // EMISE / PAYEE / ANNULEE etc.

            $table->timestamps();

            // Pour éviter doubles factures pour même période
            $table->unique(['locataire_id', 'station_id', 'mois', 'annee'], 'uniq_facture_periode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
