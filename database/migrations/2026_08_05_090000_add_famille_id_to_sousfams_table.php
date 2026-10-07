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
        Schema::table('sousfams', function (Blueprint $table) {
            $table->foreignId('famille_id')->nullable()->after('id')->constrained('familles')->cascadeOnDelete();
        });
    }

    public function down()
    {
        Schema::table('sousfams', function (Blueprint $table) {
            $table->dropForeign(['famille_id']);
            $table->dropColumn('famille_id');
        });
    }
};
