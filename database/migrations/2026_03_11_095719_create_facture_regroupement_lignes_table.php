<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facture_regroupement_lignes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('facture_regroupee_id');
            $table->unsignedBigInteger('facture_source_id');
            $table->timestamps();

            $table->foreign('facture_regroupee_id')
                ->references('id')
                ->on('factures')
                ->cascadeOnDelete();

            $table->foreign('facture_source_id')
                ->references('id')
                ->on('factures')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture_regroupement_lignes');
    }
};