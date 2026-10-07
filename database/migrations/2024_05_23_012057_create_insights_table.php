<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('insights', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('period');
            $table->unsignedBigInteger('impressions_tot')->nullable();
            $table->unsignedBigInteger('reactions_like_total')->nullable();
            $table->string('title');
            $table->text('description');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('insights');
    }
};
