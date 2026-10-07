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
            $table->dropColumn('date_acquisition');
        });

        Schema::table('patrimoines', function (Blueprint $table) {
            $table->string('date_acquisition', 20)->nullable()->after('statut');
        });
    }

    public function down()
    {
        Schema::table('patrimoines', function (Blueprint $table) {
            $table->dropColumn('date_acquisition');
        });

        Schema::table('patrimoines', function (Blueprint $table) {
            $table->date('date_acquisition')->nullable()->after('statut');
        });
    }
};
