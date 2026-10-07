<?php

namespace App\Http\Controllers;

use App\Models\Station;
use App\Models\Locataires;
use Illuminate\Http\Request;

class TestCodeController extends Controller
{
    public function generate(Request $request)
    {
        // Validation
        $request->validate([
            'station_id' => 'required|integer',
            'locataire_id' => 'required|integer',
        ]);

        // Récupérer les objets
        $station = Station::findOrFail($request->station_id);
        $locataire = Locataires::findOrFail($request->locataire_id);

        // Concaténer leurs numéros
        $code = $station->numero . $locataire->num;

        return response()->json([
            'stations' => $station->numero,
            'locataires' => $locataire->num,
            'code' => $code
        ]);
    }
}
