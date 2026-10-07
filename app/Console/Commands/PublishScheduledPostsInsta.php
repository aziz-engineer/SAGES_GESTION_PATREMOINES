<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Poste;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\PosteController;

class PublishScheduledPostsInsta extends Command
{
     /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:publish-scheduled-postsinsta';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    protected $accessToken = "EAADutQr9i3MBOxMvT8uVXkAMowZAYKQOj7iS03A5JhQBXp6rw1VyVW0aLo63tBbAKDLYClGLaYrDgOm7BmDWOXnhQwS4FFonFZAzfWtIWZCM3hf0n6qqNmMSBCKkwUtaeiDZCF7iKW4eCIvQjuVZAc1b2poKekDKR5guUZAjUAofRqmaZCxEOty9aYVKtZB4vUMZD";
    protected $instagramBusinessAccountId = "17841457605575877";

    public function handle()
    {
        
            // Get current date and time
            $now = Carbon::now();
            
            // Get all scheduled posts whose publication date is reached
            $posts = Poste::where('type', 'planifié')->where('date', '<=', $now)->get();
    
            foreach ($posts as $post) {
                 // Publish both single image and album
       $this->publishSinglesssImageToInstagram($post);
        $this->publishAlbumToInstagram($post);
            }
        }
       private function publishSinglesssImageToInstagram($post)
        {

 //kenet meghyr foreach w meghyr hedhy  $mediaIds = []; w hedhy 'image_url' => $imageUrl, kenet 'image_url' => $post->images,


            $mediaIds = [];

            foreach ($post->images as $imageUrl) {
                // Créer un objet média sur Instagram
                $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
                    'image_url' => $imageUrl,
                    'caption' => $post->statut,
                    'access_token' => $this->accessToken,
                ]);
        
                // Vérifier si la création de l'objet média a échoué
                if ($response->failed()) {
                    Log::error("Failed to create media object: {$response->body()}");
                    return;
                }
        
                // Récupérer l'ID de l'objet média créé
                $mediaIds[] = $response->json()['id'];
            }
        
            // Publier tous les médias créés en une seule fois
            $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media_publish", [
                'creation_id' => implode(',', $mediaIds), // Passer les IDs séparés par des virgules
                'access_token' => $this->accessToken,
            ]);
        
            // Vérifier si la publication de l'objet média a échoué
            if ($response->failed()) {
                Log::error("Failed to publish media: {$response->body()}");
                return;
            }
        
            // Marquer le post comme publié dans la base de données
            $post->update(['type' => 'publié']);
        }
    
        private function publishAlbumToInstagram($post)
        {
            // Implement publishing logic for an album
            $mediaIds = [];
    
            foreach ($post->images as $imageUrl) {
                $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
                    'image_url' => $imageUrl,
                    'access_token' => $this->accessToken,
                ]);
    
                if ($response->failed()) {
                    Log::error("Failed to create media object for album: {$response->body()}");
                    return;
                }
    
                $mediaIds[] = $response->json()['id'];
            }
    
            $children = implode(',', $mediaIds);
    
            $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
                'caption' => $post->statut,
                'media_type' => 'CAROUSEL',
                'children' => $children,
                'access_token' => $this->accessToken,
            ]);
    
            if ($response->failed()) {
                Log::error("Failed to create carousel media object for album: {$response->body()}");
                return;
            }
    
            $mediaId = $response->json()['id'];
    
            $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media_publish", [
                'creation_id' => $mediaId,
                'access_token' => $this->accessToken,
            ]);
    
            if ($response->failed()) {
                Log::error("Failed to publish album: {$response->body()}");
                return;
            }
    
            // Update post type to 'publié' in the database
            $post->update(['type' => 'publié']);
        }
    }