<?php

namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\Post ;
use Illuminate\Http\Request;
//use Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Facebook\Facebook;
use Facebook\Exceptions\FacebookResponseException;
use Facebook\Exceptions\FacebookSDKException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use OpenAI;
use App\Mail\EventUpdated;
use Illuminate\Support\Facades\Mail;

use Exception;
use Twilio\Rest\Client;

use Illuminate\Support\Facades\Auth; // Ajoutez cette ligne



class SocialiteController extends Controller
{
    // Les tableaux des providers autorisés
  protected $providers = ["facebook"];
  public function handleGraphInteraction(Request $request)
{
    try {
        Log::info('Début de la publication du post');

        $pageId = '287659024435386';
        $message = $request->input('message') ?? '';
        $access_token = "EAADutQr9i3MBO8xcVVwfo6Iupd1GYL5DZBeJYolyitLkUnGV4VXfCKl5gBAMUM7LtWMsEYby8u6N9kdc73q24h65nFXCmUymf0b3tNYMjZAs0ZAyOZAiZC1uE5M38KsFwK4JDVMfWgWhqxsJX2F9YNeV9ewELZCZBJD5jY0yV7i0AD1JDbUpTzYOsdP1WNuTS7r";
        $Programming_options = 'Publier';

        // Spécification du guard API pour l'authentification
        $userId = Auth::id();
        Log::info('ID de l\'utilisateur : ' . ($userId ? $userId : 'non authentifié'));
        if (!$userId) {
            Log::error('Utilisateur non authentifié');
            return response()->json(['message' => 'Utilisateur non authentifié'], 401);
        }
        Log::info('Utilisateur authentifié avec l\'ID : ' . $userId);

        $post = new Post();
        if ($request->hasFile('media_path')) {
            $mediaFile = $request->file('media_path');
            $ext = $mediaFile->getClientOriginalExtension();
            $filename = time() . '.' . $ext;
            $mediaFile->move('uploads/', $filename);
            $post->media_path = 'uploads/' . $filename;
            
            // Debugging to ensure file was moved successfully
            if (!file_exists('uploads/' . $filename)) {
                return response()->json(['error' => 'Failed to move the uploaded file.'], 500);
            }

            if ($mediaFile->getClientMimeType() == 'video/mp4') {
                $response = Http::attach(
                    'source',
                    fopen('uploads/' . $filename, 'r'),
                    $filename
                )->post("https://graph.facebook.com/v17.0/{$pageId}/videos", [
                    'description' => $message, 
                    'access_token' => $access_token,
                ]);

                if ($response->failed()) {
                    return response()->json(['error' => 'Failed to publish video on Facebook'], 500);
                }
            } else {
                $response = Http::attach(
                    'source',
                    fopen('uploads/' . $filename, 'r'),
                    'file.' . $ext
                )->post("https://graph.facebook.com/v17.0/{$pageId}/photos", [
                    'message' => $message,
                    'access_token' => $access_token,
                ]);

                if ($response->failed()) {
                    return response()->json(['error' => 'Failed to publish photo on Facebook'], 500);
                }
            }

            $postData = $response->json();
            $socialId = $postData['id'];
        }

        if (!$request->hasFile('media_path') && !$request->hasFile('media_paths') && !empty($message)) {
            $response = Http::post("https://graph.facebook.com/v17.0/{$pageId}/feed", [
                'message' => $message,
                'access_token' => $access_token,
            ]);

            if ($response->failed()) {
                return response()->json(['error' => 'Échec de la publication sur la page Facebook'], 500);
            }

            $postData = $response->json();
            $socialId = $postData['id'];
        }

        // Enregistrement des informations du post dans la base de données
        $post->social_id = $socialId;
        $post->page_id = $pageId;
        $post->message = $message;
        $post->access_token = $access_token;
        $post->Programming_options = $Programming_options;
        $post->user_id = $userId; // Associe le poste à l'utilisateur connecté

        $post->save();

        Log::info('Post publié avec succès');

        return response()->json(['social_id' => $socialId]);
    } catch (\Exception $e) {
        Log::error('Erreur lors de la publication du post: ' . $e->getMessage());
        return response()->json(['message' => 'Erreur lors de la publication du post'], 500);
    }
}

  

  public function index() {
      $postes = Post::all();
      return response()->json(["postes" => "success", "count" => count($postes), "data" => $postes]);
  }

  public function updatePlanification(Request $request, $id)
  {
      $poste = Post::findOrFail($id);
      
      $request->validate([
          'scheduledDateTime' => 'required|date_format:Y-m-d H:i'
      ]);
      $poste->scheduledDateTime = $request->input('scheduledDateTime');
      $poste->save();
      // Envoyer un e-mail à yassine.kochkache@esprit.tn
      Mail::to('yassine.kochkache@esprit.tn')->send(new EventUpdated());
      return response()->json(['message' => 'Poste mis à jour avec succès'], 200);
  }


  
//SMS
public function getsms($receiverNumber, $message, $scheduledDateTime){

    $receiverNumber = "+21623954974";
    $message = "$message' va se publier le $scheduledDateTime";
   
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
   
       $eventsWithin24Hours = Post::whereBetween('scheduledDateTime', [$currentDateTime, $twentyFourHoursLater])->get();
   
       return $eventsWithin24Hours;
   }
   











  
}