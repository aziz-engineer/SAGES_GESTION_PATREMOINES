<?php

namespace App\Http\Controllers;

use App\Models\Sousfam;
use Illuminate\Http\Request;

class SousfamController extends Controller
{
    // Lister les sous-familles (filtrables par famille)
    public function indexsf(Request $request)
    {
        $query = Sousfam::with('famille')->orderBy('nom');

        if ($request->filled('famille_id')) {
            $query->where('famille_id', $request->famille_id);
        }

        return $query->get();
    }

    // Ajouter
    public function storesf(Request $request)
    {
        $validated = $request->validate([
            'famille_id' => 'required|exists:familles,id',
            'nom' => 'required|string|max:255',
            'numero' => 'required|string|max:255',
        ]);

        $sousfam = Sousfam::create($validated);

        return response()->json($sousfam->load('famille'), 201);
    }

    // Afficher une sous-famille
    public function showsf($id)
    {
        return Sousfam::with('famille')->findOrFail($id);
    }

    // Modifier
    public function updatesf(Request $request, $id)
    {
        $sousfam = Sousfam::findOrFail($id);

        $validated = $request->validate([
            'famille_id' => 'sometimes|required|exists:familles,id',
            'nom' => 'string|max:255',
            'numero' => 'string|max:255',
        ]);

        $sousfam->update($validated);

        return response()->json($sousfam->load('famille'));
    }

    // Supprimer
    public function destroysf($id)
    {
        Sousfam::destroy($id);
        return response()->json(['message' => 'Sousfam supprimée']);
    }
}
