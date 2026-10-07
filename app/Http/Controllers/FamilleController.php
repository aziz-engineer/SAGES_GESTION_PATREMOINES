<?php

namespace App\Http\Controllers;

use App\Models\Famille;
use Illuminate\Http\Request;

class FamilleController extends Controller
{
    

    // Lister toutes les familles
    public function indexf()
    {
        return Famille::orderBy('nom')->get();
    }

    // Ajouter
    public function storef(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'numero' => 'required|string|max:255',
        ]);

        $famille = Famille::create($validated);

        return response()->json($famille, 201);
    }

    // Afficher une famille
    public function showf($id)
    {
        return Famille::findOrFail($id);
    }

    // Modifier
    public function updatef(Request $request, $id)
    {
        $famille = Famille::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'string|max:255',
            'numero' => 'string|max:255',
        ]);

        $famille->update($validated);

        return response()->json($famille);
    }

    // Supprimer
    public function destroyf($id)
    {
        famille::destroy($id);
        return response()->json(['message' => 'famille supprimée']);
    }
}
