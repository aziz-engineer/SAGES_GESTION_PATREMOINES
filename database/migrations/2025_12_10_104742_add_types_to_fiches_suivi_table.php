<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('fiches_suivi', 'types')) {
            Schema::table('fiches_suivi', function (Blueprint $table) {
                $table->json('types')->nullable()->after('date');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('fiches_suivi', 'types')) {
            Schema::table('fiches_suivi', function (Blueprint $table) {
                $table->dropColumn('types');
            });
        }
    }
};
