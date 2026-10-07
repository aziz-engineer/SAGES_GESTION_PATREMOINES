<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->string('type_facture')->default('NORMALE')->after('status');
            $table->unsignedBigInteger('parent_regroupement_id')->nullable()->after('type_facture');
            $table->date('periode_debut')->nullable()->after('parent_regroupement_id');
            $table->date('periode_fin')->nullable()->after('periode_debut');

            $table->foreign('parent_regroupement_id')
                ->references('id')
                ->on('factures')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('factures', function (Blueprint $table) {
            $table->dropForeign(['parent_regroupement_id']);
            $table->dropColumn([
                'type_facture',
                'parent_regroupement_id',
                'periode_debut',
                'periode_fin',
            ]);
        });
    }
};