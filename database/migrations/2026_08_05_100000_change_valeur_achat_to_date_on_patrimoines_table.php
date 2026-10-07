<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('patrimoines', function (Blueprint $table) {
            $table->dropColumn('valeur_achat');
        });

        Schema::table('patrimoines', function (Blueprint $table) {
            $table->date('valeur_achat')->nullable()->after('date_acquisition');
        });
    }

    public function down()
    {
        Schema::table('patrimoines', function (Blueprint $table) {
            $table->dropColumn('valeur_achat');
        });

        Schema::table('patrimoines', function (Blueprint $table) {
            $table->decimal('valeur_achat', 12, 2)->nullable()->after('date_acquisition');
        });
    }
};
