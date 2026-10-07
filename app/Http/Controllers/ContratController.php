<?php

namespace App\Http\Controllers;

use App\Models\Contrat;
use Illuminate\Http\Request;
use Carbon\Carbon;


class ContratController extends Controller
{
    // LISTE
    public function index()
    {
        return Contrat::with(['locataire', 'station'])->get();
    }
    

    public function alerts(Request $request)
    {
        $thresholdMonths = (int) ($request->query('threshold_months', 6));
        if ($thresholdMonths <= 0) $thresholdMonths = 6;

        $today = Carbon::today();
        $limit = (clone $today)->addMonths($thresholdMonths)->endOfDay();

        // On charge les contrats + relations
        $contrats = Contrat::with(['locataire', 'station'])->get();

        $alerts = [];

        foreach ($contrats as $c) {
            if (empty($c->date_debut)) continue;

            $dateDebut = Carbon::parse($c->date_debut);

            // Date fin:
            // - si date_fin existe => utiliser
            // - sinon => calculer date_debut + duree mois
            $dateFin = null;
            if (!empty($c->date_fin)) {
                $dateFin = Carbon::parse($c->date_fin);
            } else {
                $duree = (int) ($c->duree ?? 0);
                if ($duree <= 0) continue;
                $dateFin = (clone $dateDebut)->addMonths($duree);
            }

            // ignoré si déjà expiré
            if ($dateFin->lt($today)) continue;

            // alerte si dateFin <= limit
            if ($dateFin->lte($limit)) {
                $daysLeft = $today->diffInDays($dateFin, false);
                $monthsLeft = $today->diffInMonths($dateFin, false);

                // severity pro (tu peux ajuster)
                $severity = "warning"; // < 6 mois
                if ($daysLeft <= 30) $severity = "critical";
                else if ($daysLeft <= 90) $severity = "high";

                $alerts[] = [
                    'id' => $c->id,
                    'locataire_id' => $c->locataire_id,
                    'station_id' => $c->station_id,
                    'objet' => $c->objet,
                    'date_debut' => $c->date_debut,
                    'date_fin' => $dateFin->format('Y-m-d'),
                    'duree' => $c->duree,

                    'days_left' => (int) $daysLeft,
                    'months_left' => (int) $monthsLeft,
                    'severity' => $severity,

                    'locataire' => $c->locataire ? [
                        'id' => $c->locataire->id,
                        'nom' => $c->locataire->nom,
                    ] : null,
                    'station' => $c->station ? [
                        'id' => $c->station->id,
                        'nom' => $c->station->nom,
                    ] : null,
                ];
            }
        }

        // Trier: les plus urgents d'abord (days_left asc)
        usort($alerts, fn($a, $b) => ($a['days_left'] ?? 999999) <=> ($b['days_left'] ?? 999999));

        return response()->json([
            'threshold_months' => $thresholdMonths,
            'count' => count($alerts),
            'items' => $alerts,
        ]);
    }

    // CREATE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'locataire_id' => 'required|exists:locataires,id',
            'station_id' => 'required|exists:stations,id',
            'date_debut' => 'required|date',
            'duree' => 'required|integer|min:1',
            'date_fin' => 'nullable|date',
            'objet' => 'nullable|string',
            'loyer_fix_ht' => 'nullable|numeric',
            'augmentation_annuelle' => 'nullable|numeric',
            'loyer_variable' => 'nullable|string',
            'minimum_garantie' => 'nullable|string',
        ]);

        $contrat = Contrat::create($validated);

        return response()->json($contrat, 201);
    }

    // SHOW
    public function show(Contrat $contrat)
    {
        return $contrat->load(['locataire', 'station']);
    }

    // UPDATE
    public function update(Request $request, Contrat $contrat)
    {
        $validated = $request->validate([
            'locataire_id' => 'sometimes|exists:locataires,id',
            'station_id' => 'sometimes|exists:stations,id',
            'date_debut' => 'sometimes|date',
            'duree' => 'sometimes|integer|min:1',
            'date_fin' => 'nullable|date',
            'objet' => 'nullable|string',
            'loyer_fix_ht' => 'nullable|numeric',
            'augmentation_annuelle' => 'nullable|numeric',
            'loyer_variable' => 'nullable|string',
            'minimum_garantie' => 'nullable|string',
        ]);

        $contrat->update($validated);

        return response()->json($contrat);
    }

    // DELETE
    public function destroy(Contrat $contrat)
    {
        $contrat->delete();
        return response()->json(['message' => 'Contrat supprimé']);
    }
}
