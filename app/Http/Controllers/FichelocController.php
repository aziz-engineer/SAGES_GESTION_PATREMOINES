<?php

namespace App\Http\Controllers;

use App\Models\Ficheloc;
use App\Models\Locataires;
use App\Models\Station;
use Illuminate\Http\Request;

class FichelocController extends Controller
{
     // 🔥 TOUTES les fiches d’un locataire
    public function showByLocataire(Locataires $locataire)
    {
        $fiches = Ficheloc::with(['station', 'locataire'])
            ->where('locataire_id', $locataire->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($fiches);
    }
    // 📌 LISTE
    public function index()
    {
        return Ficheloc::with(['locataire', 'station'])->get();
    }

    // 📌 AJOUT
    public function store(Request $request)
    {
        $validated = $request->validate([
            'locataire_id' => 'required|exists:locataires,id',
            'station_id'   => 'required|exists:stations,id',
            'matricule_fiscale' => 'required|string|max:255',

            'adresse_facturation' => 'nullable|string',
            'contact' => 'nullable|string',
            'num_tel' => 'nullable|string',
            'fax' => 'nullable|string',
        ]);

        $ficheloc = Ficheloc::create($validated);

        return response()->json($ficheloc->load(['locataire', 'station']), 201);
    }

    // 📌 AFFICHER UNE FICHE
    public function show($id)
    {
        return Ficheloc::with(['locataire', 'station'])->findOrFail($id);
    }

    // 📌 MODIFIER
    public function update(Request $request, $id)
    {
        $ficheloc = Ficheloc::findOrFail($id);

        $validated = $request->validate([
            'locataire_id' => 'required|exists:locataires,id',
            'station_id'   => 'required|exists:stations,id',
            'matricule_fiscale' => 'required|string|max:255',

            'adresse_facturation' => 'nullable|string',
            'contact' => 'nullable|string',
            'num_tel' => 'nullable|string',
            'fax' => 'nullable|string',
        ]);

        $ficheloc->update($validated);

        return response()->json($ficheloc->load(['locataire', 'station']));
    }

    // 📌 SUPPRIMER
    public function destroy($id)
    {
        Ficheloc::destroy($id);

        return response()->json([
            'message' => 'Fiche locataire supprimée avec succès'
        ]);
    }
}
