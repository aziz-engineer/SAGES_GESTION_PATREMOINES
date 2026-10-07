<?php

namespace App\Http\Controllers;

use App\Models\Facture;
use App\Models\Reglement;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReglementController extends Controller
{
    private const MODES = ['ESPECES', 'CHEQUE', 'VIREMENT', 'TRAITE', 'CARTE'];
    private const STATUTS = ['EN_ATTENTE', 'PARTIEL', 'VALIDE', 'REJETE'];
    private const STATUTS_TRAITEMENT = ['NON_TRAITE', 'TRAITE'];

    // Nombre de jours au-delà duquel une facture impayée est considérée "en retard"
    private const RETARD_JOURS = 30;
    // Nombre de jours avant l'échéance d'un chèque/traite pour déclencher une alerte
    private const ECHEANCE_ALERTE_JOURS = 7;

    public function index(Request $request)
    {
        $q = trim((string) $request->get('q', ''));

        $query = Reglement::query()
            ->with([
                'facture:id,facture_code,facture_code_full,total_ttc,status,date_facture',
                'locataire:id,nom,num',
                'station:id,nom,numero',
            ])
            ->orderByDesc('date_reglement')
            ->orderByDesc('id');

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('num_reglement', 'like', "%{$q}%")
                    ->orWhere('reference_paiement', 'like', "%{$q}%")
                    ->orWhereHas('facture', fn ($x) => $x->where('facture_code', 'like', "%{$q}%")
                        ->orWhere('facture_code_full', 'like', "%{$q}%"))
                    ->orWhereHas('locataire', fn ($x) => $x->where('nom', 'like', "%{$q}%"))
                    ->orWhereHas('station', fn ($x) => $x->where('nom', 'like', "%{$q}%"));
            });
        }

        if ($request->filled('facture_id')) {
            $query->where('facture_id', $request->facture_id);
        }
        if ($request->filled('locataire_id')) {
            $query->where('locataire_id', $request->locataire_id);
        }
        if ($request->filled('station_id')) {
            $query->where('station_id', $request->station_id);
        }
        if ($request->filled('mode_paiement')) {
            $query->where('mode_paiement', $request->mode_paiement);
        }
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('statut_traitement')) {
            $query->where('statut_traitement', $request->statut_traitement);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('date_reglement', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_reglement', '<=', $request->date_to);
        }

        $reglements = $query->get();
        $reglements->each(fn ($r) => $r->setAttribute('is_en_retard', $this->isReglementEnRetard($r)));

        return response()->json([
            'data' => $reglements,
            'stats' => $this->buildStats(),
        ]);
    }

    public function show($id)
    {
        $reglement = Reglement::with(['facture', 'locataire', 'station'])->findOrFail($id);
        $reglement->setAttribute('is_en_retard', $this->isReglementEnRetard($reglement));

        return response()->json($reglement);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        DB::beginTransaction();

        try {
            $facture = Facture::with('locataire', 'station')->findOrFail($validated['facture_id']);

            $reglement = new Reglement($validated);
            $reglement->locataire_id = $facture->locataire_id;
            $reglement->station_id = $facture->station_id;
            $reglement->montant_facture = $facture->total_ttc;
            $reglement->num_reglement = $this->generateNumReglement();

            $this->applyStatuts($reglement, $facture, $validated);

            $reglement->save();

            $this->syncFactureStatus($facture);

            DB::commit();

            $reglement->load(['facture', 'locataire', 'station']);
            $reglement->setAttribute('is_en_retard', $this->isReglementEnRetard($reglement));

            return response()->json($reglement, 201);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Impossible d\'enregistrer le règlement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $reglement = Reglement::findOrFail($id);
        $validated = $this->validatePayload($request, $reglement->id);

        DB::beginTransaction();

        try {
            $facture = Facture::with('locataire', 'station')->findOrFail($validated['facture_id']);

            $reglement->fill($validated);
            $reglement->locataire_id = $facture->locataire_id;
            $reglement->station_id = $facture->station_id;
            $reglement->montant_facture = $facture->total_ttc;

            $this->applyStatuts($reglement, $facture, $validated, $reglement->id);

            $reglement->save();

            $this->syncFactureStatus($facture);

            DB::commit();

            $reglement->load(['facture', 'locataire', 'station']);
            $reglement->setAttribute('is_en_retard', $this->isReglementEnRetard($reglement));

            return response()->json($reglement);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Impossible de mettre à jour le règlement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $reglement = Reglement::findOrFail($id);
        $factureId = $reglement->facture_id;

        DB::beginTransaction();

        try {
            $reglement->delete();

            $facture = Facture::find($factureId);
            if ($facture) {
                $this->syncFactureStatus($facture);
            }

            DB::commit();

            return response()->json(['message' => 'Règlement supprimé avec succès.']);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Suppression impossible.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Liste des factures utilisables pour créer un règlement, avec le montant déjà réglé
     * et le reste à payer calculés à la volée.
     */
    public function facturesDisponibles(Request $request)
    {
        $query = Facture::query()
            ->with(['locataire:id,nom,num', 'station:id,nom,numero'])
            ->whereNotIn('status', ['ANNULEE', 'REGROUPEE'])
            ->orderByDesc('date_facture');

        if ($request->filled('locataire_id')) {
            $query->where('locataire_id', $request->locataire_id);
        }
        if ($request->filled('station_id')) {
            $query->where('station_id', $request->station_id);
        }

        $factures = $query->get();

        $sommesParFacture = Reglement::whereIn('facture_id', $factures->pluck('id'))
            ->where('statut', '!=', 'REJETE')
            ->groupBy('facture_id')
            ->select('facture_id', DB::raw('SUM(montant_paye) as total_paye'))
            ->pluck('total_paye', 'facture_id');

        $result = $factures->map(function (Facture $facture) use ($sommesParFacture) {
            $dejaPaye = (float) ($sommesParFacture[$facture->id] ?? 0);
            $restant = max(round((float) $facture->total_ttc - $dejaPaye, 3), 0);

            return [
                'id' => $facture->id,
                'facture_code' => $facture->facture_code,
                'facture_code_full' => $facture->facture_code_full,
                'date_facture' => $facture->date_facture,
                'total_ttc' => (float) $facture->total_ttc,
                'montant_regle' => $dejaPaye,
                'montant_restant' => $restant,
                'status' => $facture->status,
                'locataire' => $facture->locataire ? ['id' => $facture->locataire->id, 'nom' => $facture->locataire->nom] : null,
                'station' => $facture->station ? ['id' => $facture->station->id, 'nom' => $facture->station->nom] : null,
            ];
        });

        if ($request->boolean('impayees_only')) {
            $result = $result->filter(fn ($f) => $f['montant_restant'] > 0)->values();
        }

        return response()->json($result);
    }

    /**
     * Alertes: factures impayées en retard + échéances de chèques/traites proches.
     */
    public function alertes()
    {
        $seuilRetard = Carbon::today()->subDays(self::RETARD_JOURS);

        $facturesEnRetard = Facture::query()
            ->with(['locataire:id,nom,num', 'station:id,nom,numero'])
            ->whereNotIn('status', ['ANNULEE', 'REGROUPEE', 'PAYEE'])
            ->whereDate('date_facture', '<=', $seuilRetard)
            ->orderBy('date_facture')
            ->get();

        $factureIds = $facturesEnRetard->pluck('id');
        $sommesParFacture = Reglement::whereIn('facture_id', $factureIds)
            ->where('statut', '!=', 'REJETE')
            ->groupBy('facture_id')
            ->select('facture_id', DB::raw('SUM(montant_paye) as total_paye'))
            ->pluck('total_paye', 'facture_id');

        $facturesEnRetard = $facturesEnRetard
            ->map(function (Facture $facture) use ($sommesParFacture) {
                $dejaPaye = (float) ($sommesParFacture[$facture->id] ?? 0);
                $restant = max(round((float) $facture->total_ttc - $dejaPaye, 3), 0);

                if ($restant <= 0) {
                    return null;
                }

                return [
                    'id' => $facture->id,
                    'facture_code' => $facture->facture_code_full ?: $facture->facture_code,
                    'date_facture' => $facture->date_facture,
                    'jours_retard' => Carbon::parse($facture->date_facture)->diffInDays(Carbon::today()),
                    'total_ttc' => (float) $facture->total_ttc,
                    'montant_restant' => $restant,
                    'locataire' => $facture->locataire?->nom,
                    'station' => $facture->station?->nom,
                ];
            })
            ->filter()
            ->values();

        $echeancesProches = Reglement::query()
            ->with(['facture:id,facture_code,facture_code_full', 'locataire:id,nom', 'station:id,nom'])
            ->whereIn('mode_paiement', ['CHEQUE', 'TRAITE'])
            ->where('statut_traitement', 'NON_TRAITE')
            ->where('statut', '!=', 'REJETE')
            ->whereNotNull('date_echeance')
            ->whereDate('date_echeance', '<=', Carbon::today()->addDays(self::ECHEANCE_ALERTE_JOURS))
            ->orderBy('date_echeance')
            ->get()
            ->map(function (Reglement $r) {
                return [
                    'id' => $r->id,
                    'num_reglement' => $r->num_reglement,
                    'mode_paiement' => $r->mode_paiement,
                    'reference_paiement' => $r->reference_paiement,
                    'date_echeance' => $r->date_echeance,
                    'jours_restants' => Carbon::today()->diffInDays(Carbon::parse($r->date_echeance), false),
                    'montant_paye' => (float) $r->montant_paye,
                    'facture' => $r->facture?->facture_code_full ?: $r->facture?->facture_code,
                    'locataire' => $r->locataire?->nom,
                    'station' => $r->station?->nom,
                ];
            });

        return response()->json([
            'factures_en_retard' => $facturesEnRetard,
            'echeances_proches' => $echeancesProches,
        ]);
    }

    /**
     * Données pour les graphiques du dashboard: évolution 12 mois,
     * répartition par mode de paiement, top impayés par locataire.
     */
    public function analytics()
    {
        $moisFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        $months = collect(range(11, 0))->map(fn ($i) => Carbon::today()->startOfMonth()->subMonths($i));
        $rangeStart = $months->first()->copy()->startOfMonth();
        $rangeEnd = Carbon::today()->endOfMonth();

        $factureParMois = Facture::whereNotIn('status', ['ANNULEE', 'REGROUPEE'])
            ->whereBetween('date_facture', [$rangeStart, $rangeEnd])
            ->selectRaw("DATE_FORMAT(date_facture, '%Y-%m') as ym, SUM(total_ttc) as total")
            ->groupBy('ym')
            ->pluck('total', 'ym');

        $encaisseParMois = Reglement::where('statut', '!=', 'REJETE')
            ->whereBetween('date_reglement', [$rangeStart, $rangeEnd])
            ->selectRaw("DATE_FORMAT(date_reglement, '%Y-%m') as ym, SUM(montant_paye) as total")
            ->groupBy('ym')
            ->pluck('total', 'ym');

        $monthly = $months->map(function ($m) use ($factureParMois, $encaisseParMois, $moisFr) {
            $ym = $m->format('Y-m');

            return [
                'ym' => $ym,
                'label' => $moisFr[$m->month - 1] . ' ' . $m->format('y'),
                'facture_total' => round((float) ($factureParMois[$ym] ?? 0), 3),
                'encaisse_total' => round((float) ($encaisseParMois[$ym] ?? 0), 3),
            ];
        })->values();

        $parMode = Reglement::where('statut', '!=', 'REJETE')
            ->selectRaw('mode_paiement, SUM(montant_paye) as total')
            ->groupBy('mode_paiement')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'mode' => $r->mode_paiement,
                'total' => round((float) $r->total, 3),
            ])
            ->values();

        $sommesParFacture = Reglement::where('statut', '!=', 'REJETE')
            ->groupBy('facture_id')
            ->select('facture_id', DB::raw('SUM(montant_paye) as paye'))
            ->pluck('paye', 'facture_id');

        $facturesActives = Facture::whereNotIn('status', ['ANNULEE', 'REGROUPEE'])
            ->with('locataire:id,nom')
            ->get(['id', 'locataire_id', 'total_ttc']);

        $parLocataire = [];
        foreach ($facturesActives as $f) {
            $paye = (float) ($sommesParFacture[$f->id] ?? 0);
            $restant = max(round((float) $f->total_ttc - $paye, 3), 0);

            if ($restant <= 0) {
                continue;
            }

            $nom = $f->locataire->nom ?? 'Locataire inconnu';
            $parLocataire[$nom] = ($parLocataire[$nom] ?? 0) + $restant;
        }

        arsort($parLocataire);

        $topImpayes = collect($parLocataire)
            ->take(6)
            ->map(fn ($total, $label) => ['label' => $label, 'total' => round($total, 3)])
            ->values();

        return response()->json([
            'monthly' => $monthly,
            'par_mode' => $parMode,
            'top_impayes' => $topImpayes,
        ]);
    }

    public function traiter(Request $request, $id)
    {
        $reglement = Reglement::findOrFail($id);

        $reglement->statut_traitement = 'TRAITE';
        $reglement->traite_par = $request->user()?->name ?? $request->get('traite_par', 'Utilisateur');
        $reglement->traite_le = now();
        $reglement->save();

        return response()->json($reglement->load(['facture', 'locataire', 'station']));
    }

    private function validatePayload(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'facture_id' => ['required', 'exists:factures,id'],
            'mode_paiement' => ['required', Rule::in(self::MODES)],
            'reference_paiement' => [
                Rule::requiredIf(fn () => in_array($request->mode_paiement, ['CHEQUE', 'VIREMENT', 'TRAITE'])),
                'nullable', 'string', 'max:100',
            ],
            'banque' => ['nullable', 'string', 'max:100'],
            'date_reglement' => ['required', 'date'],
            'date_echeance' => ['nullable', 'date'],
            'montant_paye' => ['required', 'numeric', 'min:0.001'],
            'statut' => ['nullable', Rule::in(self::STATUTS)],
            'statut_traitement' => ['nullable', Rule::in(self::STATUTS_TRAITEMENT)],
            'observation' => ['nullable', 'string', 'max:1000'],
        ]);
    }

    /**
     * Calcule le statut du règlement (EN_ATTENTE / PARTIEL / VALIDE / REJETE)
     * en fonction du montant déjà réglé sur la facture, et gère le passage
     * en "traité" (horodatage + auteur).
     */
    private function applyStatuts(Reglement $reglement, Facture $facture, array $validated, ?int $ignoreId = null): void
    {
        $rejete = ($validated['statut'] ?? null) === 'REJETE';

        $autresReglements = Reglement::where('facture_id', $facture->id)
            ->where('statut', '!=', 'REJETE')
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->sum('montant_paye');

        $montantPayeEffectif = $rejete ? 0 : (float) $validated['montant_paye'];
        $totalPayeFacture = (float) $autresReglements + $montantPayeEffectif;
        $montantFacture = (float) $facture->total_ttc;

        $reglement->montant_restant = max(round($montantFacture - $totalPayeFacture, 3), 0);

        if ($rejete) {
            $reglement->statut = 'REJETE';
        } elseif ($totalPayeFacture <= 0) {
            $reglement->statut = 'EN_ATTENTE';
        } elseif (round($totalPayeFacture, 3) < round($montantFacture, 3)) {
            $reglement->statut = 'PARTIEL';
        } else {
            $reglement->statut = 'VALIDE';
        }

        $statutTraitement = $validated['statut_traitement'] ?? $reglement->statut_traitement ?? 'NON_TRAITE';
        $reglement->statut_traitement = $statutTraitement;

        if ($statutTraitement === 'TRAITE' && !$reglement->traite_le) {
            $reglement->traite_le = now();
            $reglement->traite_par = request()->user()?->name ?? 'Utilisateur';
        } elseif ($statutTraitement === 'NON_TRAITE') {
            $reglement->traite_le = null;
            $reglement->traite_par = null;
        }
    }

    /**
     * Met à jour le statut de la facture en fonction des règlements validés/partiels enregistrés.
     */
    private function syncFactureStatus(Facture $facture): void
    {
        if (in_array($facture->status, ['ANNULEE', 'REGROUPEE'])) {
            return;
        }

        $totalPaye = (float) Reglement::where('facture_id', $facture->id)
            ->where('statut', '!=', 'REJETE')
            ->sum('montant_paye');

        $montantFacture = (float) $facture->total_ttc;

        if ($totalPaye <= 0) {
            $status = 'EMISE';
        } elseif (round($totalPaye, 3) < round($montantFacture, 3)) {
            $status = 'PARTIELLE';
        } else {
            $status = 'PAYEE';
        }

        if ($facture->status !== $status) {
            $facture->update(['status' => $status]);
        }
    }

    private function isReglementEnRetard(Reglement $reglement): bool
    {
        if (!$reglement->date_echeance) {
            return false;
        }

        if (!in_array($reglement->mode_paiement, ['CHEQUE', 'TRAITE'])) {
            return false;
        }

        if ($reglement->statut_traitement === 'TRAITE' || $reglement->statut === 'VALIDE') {
            return false;
        }

        return Carbon::parse($reglement->date_echeance)->isPast();
    }

    private function generateNumReglement(): string
    {
        $year = now()->format('Y');
        $prefix = "REG-{$year}-";

        $last = Reglement::where('num_reglement', 'like', "{$prefix}%")
            ->orderByDesc('id')
            ->value('num_reglement');

        $sequence = 1;
        if ($last && preg_match('/(\d+)$/', $last, $m)) {
            $sequence = ((int) $m[1]) + 1;
        }

        $numReglement = $prefix . str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);

        while (Reglement::where('num_reglement', $numReglement)->exists()) {
            $sequence++;
            $numReglement = $prefix . str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
        }

        return $numReglement;
    }

    private function buildStats(): array
    {
        $reglements = Reglement::all();

        $totalEncaisse = (float) $reglements->where('statut', '!=', 'REJETE')->sum('montant_paye');
        $totalRestant = (float) $reglements->whereIn('statut', ['EN_ATTENTE', 'PARTIEL'])->sum('montant_restant');
        $totalAttendu = $totalEncaisse + $totalRestant;

        $facturesTotal = Facture::whereNotIn('status', ['ANNULEE', 'REGROUPEE'])->count();
        $facturesPayees = Facture::where('status', 'PAYEE')->count();

        return [
            'total_reglements' => $reglements->count(),
            'total_encaisse' => round($totalEncaisse, 3),
            'total_restant' => round($totalRestant, 3),
            'taux_recouvrement' => $totalAttendu > 0 ? round(($totalEncaisse / $totalAttendu) * 100, 1) : 0,
            'nb_valide' => $reglements->where('statut', 'VALIDE')->count(),
            'nb_partiel' => $reglements->where('statut', 'PARTIEL')->count(),
            'nb_en_attente' => $reglements->where('statut', 'EN_ATTENTE')->count(),
            'nb_rejete' => $reglements->where('statut', 'REJETE')->count(),
            'nb_non_traite' => $reglements->where('statut_traitement', 'NON_TRAITE')->count(),
            'factures_total' => $facturesTotal,
            'factures_payees' => $facturesPayees,
        ];
    }
}
