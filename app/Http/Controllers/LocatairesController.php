<?php

namespace App\Http\Controllers;

use App\Models\Locataires;
use Illuminate\Http\Request;

class LocatairesController extends Controller
{
    // Afficher tout
    public function index()
    {
        return Locataires::all();
    }

    // Ajouter
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'num' => 'required|string|max:255',
        ]);

        $loc = Locataires::create($validated);

        return response()->json($loc, 201);
    }

    // Afficher un locataire
    public function show($id)
    {
        return Locataires::findOrFail($id);
    }

    // Modifier
    public function update(Request $request, $id)
    {
        $loc = Locataires::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'string|max:255',
            'num' => 'string|max:255',
        ]);

        $loc->update($validated);

        return response()->json($loc);
    }

    // Supprimer
    public function destroy($id)
    {
        Locataires::destroy($id);
        return response()->json(['message' => 'Locataire supprimé']);
    }
}
