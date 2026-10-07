<?php

namespace App\Http\Controllers;


use Illuminate\Support\Facades\Storage;
use App\Models\Post;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Facebook\Facebook;
use Facebook\Exceptions\FacebookResponseException;
use Facebook\Exceptions\FacebookSDKException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth; // Ajoutez cette ligne
use App\Models\User;



class PostSchedulerController extends Controller
{
    protected $providers = ["facebook"];

    public function schedulePost(Request $request)
{
    try {
        Log::info('Début de la programmation de la publication');

        $pageId = "287659024435386";
        $message = $request->input('message') ?? '';
        $access_token = "EAADutQr9i3MBO8xcVVwfo6Iupd1GYL5DZBeJYolyitLkUnGV4VXfCKl5gBAMUM7LtWMsEYby8u6N9kdc73q24h65nFXCmUymf0b3tNYMjZAs0ZAyOZAiZC1uE5M38KsFwK4JDVMfWgWhqxsJX2F9YNeV9ewELZCZBJD5jY0yV7i0AD1JDbUpTzYOsdP1WNuTS7r";
        $scheduledDateTime = $request->input('scheduled_datetime');
        
        // Validation des entrées
        $validator = Validator::make($request->all(), [
            'message' => 'nullable',
            'scheduled_datetime' =>  'required|date_format:Y-m-d H:i:s',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        // Conversion de la date planifiée en objet Carbon
        $scheduledDateTime = Carbon::parse($scheduledDateTime);

        $now = Carbon::now();

        if ($scheduledDateTime->diffInMinutes($now) < 10 || $scheduledDateTime->diffInDays($now) > 30) {
            return response()->json(['error' => 'La date de publication doit être comprise entre 10 minutes et 30 jours après la date actuelle'], 400);
        }

        // Récupération de l'ID de l'utilisateur connecté
        $userId = Auth::id();
        if (!$userId) {
            Log::error('Utilisateur non authentifié');
            return response()->json(['message' => 'Utilisateur non authentifié'], 401);
        }

        // Gestion des médias
        $post = new Post();
        $mediaUploaded = false;

        if ($request->hasFile('media_path')) {
            $mediaFile = $request->file('media_path');

            $ext = $mediaFile->getClientOriginalExtension();
            $filename = time() . '.' . $ext;
            $mediaFile->move('uploads/about/', $filename);

            $post->media_path = 'uploads/about/' . $filename;
            $mediaUploaded = true;

            if ($mediaFile->getClientMimeType() == 'video/mp4') {
                $response = Http::attach(
                    'source',
                    fopen('uploads/about/' . $filename, 'r'),
                    'file.' . $ext
                )->post("https://graph.facebook.com/v17.0/{$pageId}/videos", [
                    'description' => $message,
                    'access_token' => $access_token,
                    'published' => false,
                    'scheduled_publish_time' => strtotime($scheduledDateTime),
                ]);
            } else {
                $response = Http::attach(
                    'source',
                    fopen('uploads/about/' . $filename, 'r'),
                    'file.' . $ext
                )->post("https://graph.facebook.com/v17.0/{$pageId}/photos", [
                    'message' => $message,
                    'access_token' => $access_token,
                    'published' => false,
                    'scheduled_publish_time' => strtotime($scheduledDateTime),
                ]);
            }

            if ($response->failed()) {
                return response()->json(['error' => 'Échec de la publication sur la page Facebook'], 500);
            }
        }

        if ($request->hasFile('media_paths')) {
            $mediaPaths = $request->file('media_paths');
            $uploadedFilesPaths = [];

            foreach ($mediaPaths as $media) {
                $extension = $media->getClientOriginalExtension();
                $filename = time() . '_' . Str::random(5) . '.' . $extension;
                $media->move('uploads/', $filename);

                $uploadedFilesPaths[] = 'uploads/' . $filename;

                $response = Http::attach(
                    'source',
                    fopen('uploads/' . $filename, 'r'),
                    $filename
                )->post("https://graph.facebook.com/v17.0/{$pageId}/photos", [
                    'message' => $message,
                    'access_token' => $access_token,
                    'published' => false,
                    'scheduled_publish_time' => $scheduledDateTime,
                ]);

                if ($response->failed()) {
                    return response()->json(['error' => 'Échec de la publication sur la page Facebook'], 500);
                }
            }

            $post->media_paths = json_encode($uploadedFilesPaths);
            $mediaUploaded = true;
        }

        if (!$mediaUploaded && !empty($message)) {
            $response = Http::post("https://graph.facebook.com/v17.0/{$pageId}/feed", [
                'message' => $message,
                'access_token' => $access_token,
                'published' => false,
                'scheduled_publish_time' => $scheduledDateTime,
            ]);

            if ($response->failed()) {
                return response()->json(['error' => 'Échec de la publication sur la page Facebook'], 500);
            }
        }
        
        // Extraction du social_id du post publié
        $postData = $response->json();
        $socialId = $postData['id'];

        // Enregistrement du post dans la base de données
        $post->user_id = $userId;
        $post->social_id = $socialId;
        $post->page_id = $pageId;
        $post->message = $message;
        $post->scheduledDateTime = $scheduledDateTime;
        $post->access_token = $access_token;
        $post->Programming_options = 'Programmée';
        $post->save();

        Log::info('Publication programmée avec succès');

        // Retourner le social_id comme réponse JSON
        return response()->json(['social_id' => $socialId]);
    } catch (\Exception $e) {
        Log::error('Erreur lors de la programmation de la publication: ' . $e->getMessage());
        return response()->json(['message' => 'Erreur lors de la programmation de la publication'], 500);
    }
}

}