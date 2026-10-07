<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('social_id')->nullable();
            $table->string('page_id'); 
            $table->text('message');
            $table->string('media_path', 1000)->nullable();
            $table->json('media_paths')->nullable();
            $table->string('post_id')->nullable(); 


         //   $table->foreignIdFor(\App\Models\User::class, 'iduser');
         $table->unsignedBigInteger('user_id'); // Ajoutez cette ligne
         $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade'); // Ajoutez cette ligne aussi

            
            $table->string('access_token')->nullable();
            $table->string('Programming_options')->default('Publier');
            $table->dateTime('scheduledDateTime')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['user_id']); // Ajoutez cette ligne
        });
        Schema::dropIfExists('posts');
    }
};
