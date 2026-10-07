<?php

namespace Tests\Unit;

//use PHPUnit\Framework\TestCase;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use App\Models\Poste;
use App\Models\User;


class PosteControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testIndexAdmReturnsAllPosts()
    {
      // Assurez-vous qu'il y a un ou plusieurs postes créés dans la base de données
    $postes = Poste::factory()->create([
        'statut' => 'Quam iure vel sed odit placeat.',
        'type' => 'planifié',
        'date' => '1977-04-18 20:37:19'
    ]);

    // Effectuer une requête GET sur l'API
    $response = $this->getJson('/api/imagesadm');

    // Vérifier que la réponse a le statut HTTP 200
    $response->assertStatus(200);

    // Utiliser assertJsonFragment pour vérifier la présence des informations spécifiques dans la réponse JSON
    $response->assertJsonFragment([
        'statut' => 'Quam iure vel sed odit placeat.',
        'type' => 'planifié',
        'date' => '1977-04-18 20:37:19', // Assurez-vous que la date est dans le format attendu
    ]);
    }



     /** @test */
     public function it_returns_posts_for_authenticated_user()
     {
         // Créer un utilisateur
         $user = \App\Models\User::factory()->create();
 
         // Créer des postes pour cet utilisateur
         $postes = Poste::factory(3)->create(['user_id' => $user->id]);
 
         // Simuler l'authentification de l'utilisateur
         $this->actingAs($user);
 
         // Effectuer une requête GET sur l'API
         $response = $this->getJson('/api/images');
 
         // Vérifier que le statut HTTP de la réponse est 200
         $response->assertStatus(200);
 
         // Vérifier le contenu JSON de la réponse
         $response->assertJson([
             "postes" => "success",
             "count" => 3, // Nombre de postes créés
         ]);
 
         // Vérifier que les données des postes retournées sont correctes
         foreach ($postes as $poste) {
             $response->assertJsonFragment([
                 "id" => $poste->id,
                 "user_id" => $user->id,
                 "statut" => $poste->statut, // Supposons que 'statut' est un champ dans le modèle Poste
             ]);
         }
     }
 
     /** @test */
     public function it_returns_empty_when_no_posts_for_authenticated_user()
     {
         // Créer un utilisateur
         $user = \App\Models\User::factory()->create();
 
         // Simuler l'authentification de l'utilisateur
         $this->actingAs($user);
 
         // Effectuer une requête GET sur l'API sans créer de postes
         $response = $this->getJson('/api/images');
 
         // Vérifier que le statut HTTP de la réponse est 200
         $response->assertStatus(200);
 
         // Vérifier que la réponse JSON indique qu'il n'y a pas de postes
         $response->assertJson([
             "postes" => "success",
             "count" => 0,
             "data" => [],
         ]);
     }









    /** @test */
    public function it_saves_post_and_checks_validation_for_planned_post()
    {
        // Créer un utilisateur
        $user = \App\Models\User::factory()->create();

        // Simuler l'utilisateur authentifié
        $this->actingAs($user);

        // Données de la requête
        $data = [
            'album_items' => [
                ['image_url' => 'http://example.com/image1.jpg'],
                ['image_url' => 'http://example.com/image2.jpg']
            ],
            'image_url' => null,
            'caption' => 'Test Caption',
            'type' => 'planifié',
            'date' => now()->addDay()->format('Y-m-d H:i:s')
        ];

        // Envoyer la requête POST
        $response = $this->postJson('/api/instagram', $data);

        // Vérifier la réponse JSON
        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);
    }

    /** @test */
    public function it_handles_validation_error_for_invalid_date()
    {
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        $data = [
            'album_items' => [],
            'image_url' => null,
            'caption' => 'Test Caption',
            'type' => 'planifié',
            'date' => 'invalid-date'
        ];

        $response = $this->postJson('/api/instagram', $data);

        $response->assertStatus(200); // Ou 422 selon votre configuration de validation
        $response->assertJsonStructure([
            'status',
            'message',
            'errors'
        ]);
    }

    /** @test */
    public function it_handles_publish_post()
    {
        // Simuler l'utilisateur authentifié
        $user = \App\Models\User::factory()->create();
        $this->actingAs($user);

        // Configurer les données pour un post publié
        $data = [
            'album_items' => [],
            'image_url' => 'http://example.com/image.jpg',
            'caption' => 'Published Post',
            'type' => 'publié',
            'date' => now()->format('Y-m-d H:i:s')
        ];

        // Espérer la publication sur Instagram
        Http::fake([
            "https://graph.facebook.com/v19.0/*/media" => Http::response(['id' => '123456']),
            "https://graph.facebook.com/v19.0/*/media_publish" => Http::response(['id' => '78910']),
        ]);

        $response = $this->postJson('/api/instagram', $data);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);
    }











    



    
}