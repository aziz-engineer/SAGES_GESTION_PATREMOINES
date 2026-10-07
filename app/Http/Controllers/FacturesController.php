<?php

namespace App\Http\Controllers;


use App\Models\Contrat;
use App\Models\Facture;
use App\Models\FactureLigne;
use Illuminate\Http\Request;
use Carbon\Carbon;
class FacturesController extends Controller
{
    /**
     * GET /api/factures
     * Filtres:
     * - q : recherche dans facture_code, locataire.nom, station.nom
     * - locataire_id
     * - station_id
     * - mois
     * - annee
     * - status
     * - date_from, date_to (YYYY-MM-DD)
     * Pagination:
     * - per_page (default 15)
     */
    public function index(Request $request)
    {
        $perPage = (int)($request->get('per_page', 15));
        $q = trim((string)$request->get('q', ''));

        $query = Facture::query()
            ->with([
                'locataire:id,nom,num',
                'station:id,nom,numero',
                'contrat:id,objet',
            ])
            ->orderByDesc('date_facture')
            ->orderByDesc('id');

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('facture_code', 'like', "%{$q}%")
                   ->orWhere('facture_code_full', 'like', "%{$q}%")
                   ->orWhereHas('locataire', fn($x) => $x->where('nom', 'like', "%{$q}%"))
                   ->orWhereHas('station', fn($x) => $x->where('nom', 'like', "%{$q}%"));
            });
        }

        if ($request->filled('locataire_id')) {
            $query->where('locataire_id', $request->locataire_id);
        }
        if ($request->filled('station_id')) {
            $query->where('station_id', $request->station_id);
        }
        if ($request->filled('mois')) {
            $query->where('mois', (int)$request->mois);
        }
        if ($request->filled('annee')) {
            $query->where('annee', (int)$request->annee);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('date_facture', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_facture', '<=', $request->date_to);
        }

        return response()->json(
            $query->paginate($perPage)
        );
    }

    /**
     * GET /api/factures/{id}
     * Retourne header + lignes
     */
    public function show($id)
    {
        $facture = Facture::with([
            'locataire:id,nom,num',
            'station:id,nom,numero',
            'contrat:id,objet',
            'lignes:id,facture_id,type,libelle,montant_htva',
        ])->findOrFail($id);

        return response()->json($facture);
    }

   
}
