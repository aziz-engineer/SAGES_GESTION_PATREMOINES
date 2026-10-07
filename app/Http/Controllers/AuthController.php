<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\SignupRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\SendResetLinkRequest;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;





use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UpdatePwd;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;





class AuthController extends Controller
{
    public function signup(SignupRequest $request)
    {
        $data = $request->validated();

        $path = null;
        if ($request->hasFile('imageduprofile')) {
            $path = $request->file('imageduprofile')->store('profile_images', 'public');
        }

        /** @var \App\Models\User $user */
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'imageduprofile' => $path,
            'numtelephone' => $data['numtelephone'],
            'adresse' => $data['adresse'],
        ]);

        $token = $user->createToken('main')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $remember = $credentials['remember'] ?? false;
        unset($credentials['remember']);

        if (!Auth::attempt($credentials, $remember)) {
            return response([
                'error' => 'The Provided credentials are not correct'
            ], 422);
        }
        $user = Auth::user();
        $token = $user->createToken('main')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();
        // Revoke the token that was used to authenticate the current request...
        $user->currentAccessToken()->delete();

        return response([
            'success' => true
        ]);
    }

    public function auth(Request $request)
    {
        return $request->user();
    }














   /* public function sendResetLinkEmail(SendResetLinkRequest $request)
    {
        $credentials = $request->validated();

        $status = Password::sendResetLink($credentials);

        return $status === Password::RESET_LINK_SENT
            ? response(['status' => __($status)])
            : response(['email' => __($status)], 422);
    }

    public function reset(ResetPasswordRequest $request)
    {
        $credentials = $request->validated();

        $status = Password::reset($credentials, function ($user, $password) {
            $user->forceFill([
                'password' => bcrypt($password)
            ])->setRememberToken(Str::random(60));

            $user->save();
        });

        return $status === Password::PASSWORD_RESET
            ? response(['status' => __($status)])
            : response(['email' => [__($status)]], 422);
    }*/



    public function changePassword(UpdatePwd $request)
    {
        // Récupérer l'utilisateur authentifié
        $user = Auth::user();

        // Vérifiez si le mot de passe actuel correspond
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['error' => 'Le mot de passe actuel ne correspond pas.'], 422);
        }

        // Mettre à jour le mot de passe
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['success' => 'Mot de passe mis à jour avec succès.']);
    }



    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = Auth::user();
        $data = $request->validated();

        if ($request->hasFile('imageduprofile')) {
            $path = $request->file('imageduprofile')->store('profile_images', 'public');
            $data['imageduprofile'] = $path;
        }
        if (!empty($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }

        $user->update($data);

        return response([
            'user' => $user,
            'message' => 'Profile updated successfully'
        ]);


    }
    public function userProfile(Request $request)
    {
        // Récupérez l'utilisateur authentifié
        $user = Auth::user();

        // Vérifiez si l'utilisateur existe
        if (!$user) {
            return response()->json(['error' => 'Utilisateur non trouvé'], 404);
        }

        // Retournez les informations de l'utilisateur
        return response()->json(['user' => $user]);
    }
    

}




