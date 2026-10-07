<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Poste;
use App\Models\Draft;

use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
//use OpenAI\Laravel\Facades\OpenAI;
//use \OpenAI;
use OpenAI;
use Illuminate\Support\Facades\Http;



use Google\Cloud\Language\LanguageClient;
use Illuminate\View\View;

use Facebook\Facebook;
use Facebook\Exceptions\FacebookResponseException;
use Facebook\Exceptions\FacebookSDKException;
use Instagram\Instagram;
use Instagram\Exceptions\InstagramResponseException;
use Instagram\Exceptions\InstagramSDKException;
use Illuminate\Support\Facades\Log;
//use GuzzleHttp\Client;

use App\Models\User;
use Illuminate\Support\Facades\Auth; // Ajoutez cette ligne


//use Intervention\Image\Facades\Image;
//use GuzzleHttp\Client;

use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

use Exception;
use Twilio\Rest\Client;


use App\Mail\EventUpdated;
use Illuminate\Support\Facades\Mail;


class PosteController extends Controller
{
    //
    
protected $accessToken = "EAADutQr9i3MBOxMvT8uVXkAMowZAYKQOj7iS03A5JhQBXp6rw1VyVW0aLo63tBbAKDLYClGLaYrDgOm7BmDWOXnhQwS4FFonFZAzfWtIWZCM3hf0n6qqNmMSBCKkwUtaeiDZCF7iKW4eCIvQjuVZAc1b2poKekDKR5guUZAjUAofRqmaZCxEOty9aYVKtZB4vUMZD";
protected $instagramBusinessAccountId = "17841457605575877"; 


    public function planificationfinal2(Request $request)
{
    $albumItems = $request->input('album_items');
    $imageUrl = $request->input('image_url');
    $caption = $request->input('caption');
    $type = $request->input('type');
    $date = $request->input('date');

    $imageNames = [];

    if ($albumItems) {
        // Handle multiple images
        foreach ($albumItems as $item) {
            $imageNames[] = $item['image_url'];
        }
    } else {
        // Handle single image
        $imageNames[] = $imageUrl;
    }

     // Validation du champ type
     $validator = Validator::make($request->all(), [
        'type' => 'required|in:publié,brouillon,planifié',
    ]);

    if ($validator->fails()) {
        return response()->json(["status" => "failed", "message" => "Validation error", "errors" => $validator->errors()]);
    }

    // Validation de la date uniquement si le type est 'planifié'
    if ($type === 'planifié') {
        $validatorDate = Validator::make(['date' => $date], [
            'date' => 'required|date_format:Y-m-d H:i:s', // format date et heure
        ]);

        if ($validatorDate->fails()) {
            return response()->json(["status" => "failed", "message" => "Validation error for date", "errors" => $validatorDate->errors()]);
        }

        // Vérifier si la date planifiée est dépassée
        $date = Carbon::parse($date);
        if ($date->isPast()) {
            // Mettre à jour le type en 'publié'
            $type = 'publié';
        }
    }

 // Récupération de l'ID de l'utilisateur connecté
 $userId = Auth::id();
 if (!$userId) {
     Log::error('Utilisateur non authentifié');
     return response()->json(['message' => 'Utilisateur non authentifié'], 401);
 }
    // Save the data to the database
    $post = new Poste();
    $post->statut = $caption;
    $post->images = $imageNames;
    $post->type = $type;
    $post->date = $date;
    $post->user_id = $userId;

    $post->save();

    // Check and publish on Instagram
    if ($type === 'publié') {
        if ($albumItems) {
            return $this->publishAlbumssToInstagram1($albumItems, $caption);
        } else {
            return $this->publishSingleImageToInstagram($imageUrl, $caption);
        }
    } elseif ($type === 'planifié') {
        return response()->json(['message' => 'La publication est prévue pour une date et une heure spécifiques']);
    }

    return response()->json(['status' => 'success', 'message' => 'L\'image a été enregistrée dans la base de données.']);
}

private function publishSingleImageToInstagram($imageUrl, $caption)
{
    // Implement publishing logic for a single image
    $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
        'image_url' => $imageUrl,
        'caption' => $caption,
        'access_token' => $this->accessToken,
    ]);

    if ($response->failed()) {
        Log::error("Failed to create media object: {$response->body()}");
        return response()->json(['error' => 'Failed to create media object on Instagram'], 500);
    }

    $mediaId = $response->json()['id'];

    // Publish the media object
    $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media_publish", [
        'creation_id' => $mediaId,
        'access_token' => $this->accessToken,
    ]);

    if ($response->failed()) {
        Log::error("Failed to publish media: {$response->body()}");
        return response()->json(['error' => 'Failed to publish media on Instagram'], 500);
    }

    // Extract the social_id of the published post
    $postData = $response->json();
    $socialId = $postData['id'];

    // Return the social_id as JSON response
    return response()->json(['social_id' => $socialId]);
}

private function publishAlbumssToInstagram1($albumItems, $caption)
{
    // Implement publishing logic for an album
    $mediaIds = [];

    foreach ($albumItems as $item) {
        $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
            'image_url' => $item['image_url'],
            'access_token' => $this->accessToken,
        ]);

        if ($response->failed()) {
            Log::error("Failed to create media object for album: {$response->body()}");
            return response()->json(['error' => 'Failed to create media object for album on Instagram'], 500);
        }

        $mediaIds[] = $response->json()['id'];
    }

    $children = implode(',', $mediaIds);

    $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
        'caption' => $caption,
        'media_type' => 'CAROUSEL',
        'children' => $children,
        'access_token' => $this->accessToken,
    ]);

    if ($response->failed()) {
        Log::error("Failed to create carousel media object for album: {$response->body()}");
        return response()->json(['error' => 'Failed to create carousel media object for album on Instagram'], 500);
    }

    $mediaId = $response->json()['id'];

    $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media_publish", [
        'creation_id' => $mediaId,
        'access_token' => $this->accessToken,
    ]);

    if ($response->failed()) {
        Log::error("Failed to publish album: {$response->body()}");
        return response()->json(['error' => 'Failed to publish album on Instagram'], 500);
    }

    $postData = $response->json();
    $socialId = $postData['id'];

    // Update the post with the social ID
    // $poste->social_id = $socialId;

    // Return the social_id as JSON response
    return response()->json(['social_id' => $socialId]);
}





public function index() {
        // Obtenir l'ID de l'utilisateur connecté
        $userId = Auth::id();

        // Filtrer les postes par l'ID de l'utilisateur connecté
        $postes = Poste::where('user_id', $userId)->get();
    
        return response()->json(["postes" => "success", "count" => count($postes), "data" => $postes]);
    
}




public function indexadm() {
    $postes = Poste::all();
    return response()->json(["postes" => "success", "count" => count($postes), "data" => $postes]);
}

public function planifies()
{
    try {
        // Obtenir l'ID de l'utilisateur connecté
        $userId = Auth::id();
        
        if (!$userId) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        // Filtrer les postes par l'ID de l'utilisateur connecté et le type 'planifié'
        $postsPlanifies = Poste::where('user_id', $userId)->where('type', 'planifié')->get();

        return response()->json($postsPlanifies);
    } catch (\Exception $e) {
        Log::error('Error fetching planifies: ' . $e->getMessage());
        return response()->json(['error' => 'Internal Server Error'], 500);
    }
}


public function planifiestesttt()
{
    
        // Filtrer les postes par l'ID de l'utilisateur connecté et le type 'planifié'
        $postsPlanifies = Poste::where('type', 'planifié')->get();

        return response()->json($postsPlanifies);

}
public function drafttesttt()
{
    
        // Filtrer les postes par l'ID de l'utilisateur connecté et le type 'brouillon'
        $postsPlanifies = Poste::where('type', 'brouillon')->get();

        return response()->json($postsPlanifies);

}


public function publiertesttt()
{
    
        // Filtrer les postes par l'ID de l'utilisateur connecté et le type 'publié'
        $postsPlanifies = Poste::where('type', 'publié')->get();

        return response()->json($postsPlanifies);

}

public function showid($id)
    {
        $event = Poste::findOrFail($id); // Assurez-vous que l'événement existe

        return response()->json($event);
    }


public function update(Request $request, Poste $post)
{
    // Vérifier si l'utilisateur est connecté
    if (Auth::check()) {
        // Vérifier si le poste à mettre à jour a été ajouté par l'utilisateur connecté
        if ($post->user_id === Auth::id()) {
            $request->validate([
                'date' => 'required|date', // Validez que la nouvelle date est une date valide
            ]);

            // Mettez à jour la date de l'événement
            $post->update([
                'date' => $request->date,
            ]);

            // Envoyer un SMS
            // $this->getsms();

            // Envoyer un e-mail à yassine.kochkache@esprit.tn
           Mail::to('yassine.kochkache@esprit.tn')->send(new EventUpdated());

            return response()->json(['message' => 'Date updated successfully']);
        } else {
            // Retourner une réponse si l'utilisateur n'a pas la permission de modifier ce poste
            return response()->json(['message' => 'Unauthorized'], 401);
        }
    } else {
        // Retourner une réponse si l'utilisateur n'est pas connecté
        return response()->json(['message' => 'Unauthorized'], 401);
    }
}

//SMS
public function getsms($receiverNumber, $statut, $date){

 $receiverNumber = "+21623954974";
 $message = "$statut' will be posted in instagram on  $date";

 try{
    $account_sid = getenv("TWILIO_SID");
    $auth_token = getenv("TWILIO_TOKEN");
    $twilio_number = getenv("TWILIO_FROM");
     
    $client = new  Client ($account_sid,$auth_token);
    $client->messages->create($receiverNumber,  [
          'from' => $twilio_number,
          'body' => $message

    ]);
    dd('SMS Sent Successfully');




    


 } 
 catch(Exception $e){
    dd("Error: ". $e->getMessage());



 }


}


public function getEventsWithin24Hours() {
    $currentDateTime = now();
    $twentyFourHoursLater = $currentDateTime->copy()->addHours(24);

    $eventsWithin24Hours = Poste::whereBetween('date', [$currentDateTime, $twentyFourHoursLater])->get();

    return $eventsWithin24Hours;
}








public function genereria(
    Request $request
) {
    $openAIClient = OpenAI::client(config('openai.api_key'));
    $profileContent = $request->get('content');

    $profile = $openAIClient
        ->completions()
        ->create([
            "model" => "gpt-3.5-turbo-instruct",
            "temperature" => 0.7,
            "top_p" => 1,
            "frequency_penalty" => 0,
            "presence_penalty" => 0,
            'max_tokens' => 600,
            'prompt' => "regénérer le texte suivant {$profileContent}",
        ]);

    return  response()->json([

        'data' =>     trim($profile->choices[0]->text),
      ],200);


}



public function show($postId)
    {
        try {
            $post = Poste::findOrFail($postId);
            // Vous pouvez ajouter d'autres données à envoyer selon vos besoins
            return response()->json($post);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Post not found'], 404);
        }
    }



    public function scheduleDraft($post_id, Request $request)
    {
        // Validation des entrées
        $validator = Validator::make($request->all(), [
            //'date' => 'required|date_format:Y-m-d H:i:s|after:now', // La date doit être dans le futur
      // Valider la date avec le format datetime-local
      'date' => 'required|date_format:Y-m-d H:i:s', // format date et heure
    

        ]);

        if ($validator->fails()) {
            return response()->json(["status" => "failed", "message" => "Validation error", "errors" => $validator->errors()]);
        }

        // Récupération des données validées
        $date = $request->input('date');

        // Trouver le poste et vérifier qu'il appartient à l'utilisateur authentifié
        $post = Poste::where('id', $post_id)
                      ->where('user_id', Auth::id())
                      ->first();

        if (!$post) {
            return response()->json(['status' => 'failed', 'message' => 'Post not found or unauthorized'], 404);
        }

        // Mettre à jour le type et la date de planification
        $post->type = 'planifié';
        $post->date = $date;
        $post->save();

        return response()->json(['status' => 'success', 'message' => 'Post scheduled successfully']);
    }





    public function publishDraft($post_id)
    {
        // Assurer que l'utilisateur est authentifié
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['status' => 'failed', 'message' => 'Utilisateur non authentifié'], 401);
        }

        // Trouver le poste et vérifier qu'il appartient à l'utilisateur authentifié
        $post = Poste::where('id', $post_id)
                      ->where('type', 'brouillon')
                      ->where('user_id', $userId)
                      ->first();

        if (!$post) {
            return response()->json(['status' => 'failed', 'message' => 'Post not found or unauthorized'], 404);
        }

        // Mettre à jour le type en 'publié'
        $post->type = 'publié';
        $post->save();

        // Publier sur Instagram
        if ($post->images && is_array($post->images)) {
            if (count($post->images) > 1) {
                // Publier un album
                $albumItems = array_map(function($imageUrl) {
                    return ['image_url' => $imageUrl];
                }, $post->images);
                return $this->publishAlbumssToInstagram01($albumItems, $post->statut);
            } else {
                // Publier une seule image
                return $this->publishSingleImageToInstagram01($post->images[0], $post->statut);
            }
        }

        return response()->json(['status' => 'success', 'message' => 'Post published successfully']);
    }

    private function publishSingleImageToInstagram01($imageUrl, $caption)
    {
        // Implement publishing logic for a single image
        $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
            'image_url' => $imageUrl,
            'caption' => $caption,
            'access_token' => $this->accessToken,
        ]);

        if ($response->failed()) {
            Log::error("Failed to create media object: {$response->body()}");
            return response()->json(['error' => 'Failed to create media object on Instagram'], 500);
        }

        $mediaId = $response->json()['id'];

        // Publish the media object
        $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media_publish", [
            'creation_id' => $mediaId,
            'access_token' => $this->accessToken,
        ]);

        if ($response->failed()) {
            Log::error("Failed to publish media: {$response->body()}");
            return response()->json(['error' => 'Failed to publish media on Instagram'], 500);
        }

        // Extract the social_id of the published post
        $postData = $response->json();
        $socialId = $postData['id'];

        // Return the social_id as JSON response
        return response()->json(['social_id' => $socialId]);
    }

    private function publishAlbumssToInstagram01($albumItems, $caption)
    {
        // Implement publishing logic for an album
        $mediaIds = [];

        foreach ($albumItems as $item) {
            $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
                'image_url' => $item['image_url'],
                'access_token' => $this->accessToken,
            ]);

            if ($response->failed()) {
                Log::error("Failed to create media object for album: {$response->body()}");
                return response()->json(['error' => 'Failed to create media object for album on Instagram'], 500);
            }

            $mediaIds[] = $response->json()['id'];
        }

        $children = implode(',', $mediaIds);

        $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media", [
            'caption' => $caption,
            'media_type' => 'CAROUSEL',
            'children' => $children,
            'access_token' => $this->accessToken,
        ]);

        if ($response->failed()) {
            Log::error("Failed to create carousel media object for album: {$response->body()}");
            return response()->json(['error' => 'Failed to create carousel media object for album on Instagram'], 500);
        }

        $mediaId = $response->json()['id'];

        $response = Http::post("https://graph.facebook.com/v19.0/{$this->instagramBusinessAccountId}/media_publish", [
            'creation_id' => $mediaId,
            'access_token' => $this->accessToken,
        ]);

        if ($response->failed()) {
            Log::error("Failed to publish album: {$response->body()}");
            return response()->json(['error' => 'Failed to publish album on Instagram'], 500);
        }

        $postData = $response->json();
        $socialId = $postData['id'];

        // Return the social_id as JSON response
        return response()->json(['social_id' => $socialId]);
    }
}