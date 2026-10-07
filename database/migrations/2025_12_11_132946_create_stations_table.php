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
    Schema::create('stations', function (Blueprint $table) {
        $table->id();
        $table->string('nom');      // nom de la station
        $table->string('numero');   // numéro de station
        $table->timestamps();
    });
}

public function down()
{
    Schema::dropIfExists('stations');
}

};
