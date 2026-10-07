<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->index('locataire_id', 'factures_locataire_id_index');
            $table->dropUnique('uniq_facture_periode');
            $table->index(['locataire_id', 'station_id', 'mois', 'annee'], 'idx_facture_periode');
        });
    }

    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->dropIndex('idx_facture_periode');
            $table->dropIndex('factures_locataire_id_index');
            $table->unique(['locataire_id', 'station_id', 'mois', 'annee'], 'uniq_facture_periode');
        });
    }
};
