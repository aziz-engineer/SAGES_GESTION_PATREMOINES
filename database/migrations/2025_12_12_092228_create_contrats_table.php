<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('contrats', function (Blueprint $table) {
            $table->id();

            $table->foreignId('locataire_id')
                  ->constrained('locataires')
                  ->cascadeOnDelete();

            $table->foreignId('station_id')
                  ->constrained('stations')
                  ->cascadeOnDelete();

            $table->date('date_debut');
            $table->integer('duree'); // en mois
            $table->date('date_fin')->nullable();

            $table->string('objet')->nullable();

            $table->decimal('loyer_fix_ht', 12, 3)->nullable();
            $table->decimal('augmentation_annuelle', 5, 2)->nullable(); // %
            $table->text('loyer_variable')->nullable();
            $table->text('minimum_garantie')->nullable();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('contrats');
    }
};
