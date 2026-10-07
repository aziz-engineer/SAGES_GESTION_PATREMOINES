<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('fiches_suivi', function (Blueprint $table) {

            $table->id();

            $table->foreignId('tenant_id')
                ->constrained('tenants')
                ->onDelete('cascade');

            $table->date('date')->nullable();

            // tableau JSON permettant d’avoir 1, 2 ou 3 types en même temps
            $table->json('types')->nullable(); 

            // ───── Redevance fixe ─────
            $table->decimal('montant_ht', 10, 3)->nullable();
            $table->date('date_echeance')->nullable();
            $table->date('date_paiement')->nullable();

            // ───── Redevance variable ─────
            $table->decimal('ca_ttc', 10, 3)->nullable();
            $table->decimal('ca_taxable_ht', 10, 3)->nullable();
            $table->decimal('ca_com_v_ht', 10, 3)->nullable();
            $table->date('ca_date_echeance')->nullable();
            $table->date('ca_date_paiement')->nullable();

            // ───── Consommation ─────
            // Electricité
            $table->decimal('elec_quantite', 10, 3)->nullable();
            $table->decimal('elec_prix_total_ht', 10, 3)->nullable();

            // Gaz
            $table->decimal('gaz_quantite', 10, 3)->nullable();
            $table->decimal('gaz_prix_total_ht', 10, 3)->nullable();

            // Eau
            $table->decimal('eau_quantite', 10, 3)->nullable();
            $table->decimal('eau_prix_total_ht', 10, 3)->nullable();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('fiches_suivi');
    }
};
