<?php

namespace App\Http\Controllers;

use Validator;
use Illuminate\Support\Facades\Storage;
use App\Models\Post;
use App\Models\User;

use Illuminate\Http\Request;
//use Socialite;
use Illuminate\Support\Facades\Http;
use Facebook\Facebook;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth; // Ajoutez cette ligne


class DraftController extends Controller
{
    public function saveDraft(Request $request)
    {
        try {
            Log::info('Début de la sauvegarde du brouillon');

            // Récupération des données de la requête
            $pageId = '287659024435386';
            $message = $request->input('message') ?? '';
            $Programming_options = 'Brouillons';

            $post = new Post();
            if ($request->hasFile('media_path')) {
                Log::info('Traitement du fichier media_path');
                $mediaFile = $request->file('media_path');
                $ext = $mediaFile->getClientOriginalExtension();
                $filename = time() . '.' . $ext;
                $mediaFile->move('uploads/about/', $filename);
                $post->media_path = 'uploads/about/' . $filename;
            }

            if ($request->hasFile('media_paths')) {
                Log::info('Traitement des fichiers media_paths');
                $mediaPaths = $request->file('media_paths');

                $uploadedFilesPaths = [];

                foreach ($mediaPaths as $media) {
                    $extension = $media->getClientOriginalExtension();
                    $filename = time() . '_' . Str::random(5) . '.' . $extension;
                    $media->move('uploads/', $filename);
                    $uploadedFilesPaths[] = 'uploads/' . $filename;
                }

                $post->media_paths = json_encode($uploadedFilesPaths);
            }

            // Vérification de l'authentification de l'utilisateur
            $userId = Auth::id();
            if (!$userId) {
                Log::error('Utilisateur non authentifié');
                return response()->json(['message' => 'Utilisateur non authentifié'], 401);
            }
            Log::info('Utilisateur authentifié avec l\'ID : ' . $userId);

            // Création et sauvegarde du post en tant que brouillon
            $post->page_id = $pageId;
            $post->message = $message;
            $post->Programming_options = $Programming_options;
            $post->user_id = $userId; // Associe le poste à l'utilisateur connecté

            $post->save();
            Log::info('Brouillon sauvegardé avec succès');

            return response()->json(['message' => 'Post sauvegardé en tant que brouillon']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la sauvegarde du brouillon: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la sauvegarde du brouillon'], 500);
        }
    }
}