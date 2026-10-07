<?php

namespace App\Http\Controllers;

use App\Models\Station;
use Illuminate\Http\Request;

class StationController extends Controller
{
    // Liste
    public function index()
    {
        return Station::withCount('patrimoines')->orderBy('nom')->get();
    }

    // Ajouter
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'numero' => 'required|string|max:255',
        ]);

        $station = Station::create($validated);

        return response()->json($station, 201);
    }

    // Afficher une station
    public function show($id)
    {
        return Station::findOrFail($id);
    }

    // Modifier
    public function update(Request $request, $id)
    {
        $station = Station::findOrFail($id);

        $validated = $request->validate([
            'nom' => 'string|max:255',
            'numero' => 'string|max:255',
        ]);

        $station->update($validated);

        return response()->json($station);
    }

    // Supprimer
    public function destroy($id)
    {
        Station::destroy($id);
        return response()->json(['message' => 'Station supprimée']);
    }
}
