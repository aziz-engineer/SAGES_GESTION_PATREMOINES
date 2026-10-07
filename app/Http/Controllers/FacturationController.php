<?php

namespace App\Http\Controllers;

use App\Models\Contrat;
use App\Models\Facture;
use App\Models\FactureLigne;
use App\Models\Locataires;
use App\Models\Station;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;


class FacturationController extends Controller
{
    private function buildUniqueCodeParts(string $baseCode, string $suffix = ''): array
    {
        $latestMatchingCode = Facture::query()
            ->where('facture_code', $baseCode)
            ->orWhere('facture_code', 'like', $baseCode . '-%')
            ->orderByDesc('id')
            ->value('facture_code');

        if (!$latestMatchingCode) {
            $factureCode = $baseCode;
        } elseif ($latestMatchingCode === $baseCode) {
            $factureCode = $baseCode . '-02';
        } elseif (preg_match('/^(.*)-(\d+)$/', $latestMatchingCode, $matches)) {
            $factureCode = $matches[1] . '-' . str_pad((string) (((int) $matches[2]) + 1), 2, '0', STR_PAD_LEFT);
        } else {
            $factureCode = $baseCode . '-02';
        }

        return [
            'facture_code' => $factureCode,
            'facture_suffix' => $suffix,
            'facture_code_full' => $factureCode . ($suffix ? ' ' . $suffix : ''),
        ];
    }

    private function computeData(Request $request): array
    {
        $request->validate([
            'locataire_id'    => 'required|exists:locataires,id',
            'station_id'      => 'required|exists:stations,id',
            'date_facture'    => 'required|date',
            'mois'            => 'required|integer|min:1|max:12',
            'variable_ttc'    => 'nullable|numeric|min:0',

            'electricite_ht'  => 'nullable|numeric|min:0',
            'eau_ht'          => 'nullable|numeric|min:0',
            'gaz_ht'          => 'nullable|numeric|min:0',
            'personnel_ht'    => 'nullable|numeric|min:0',

            'charge_complementaire_ht'       => 'nullable|numeric|min:0',
            'charge_complementaire_comment'  => 'nullable|string|max:120',
        ]);

        $contrat = Contrat::with(['locataire', 'station'])
            ->where('locataire_id', $request->locataire_id)
            ->where('station_id', $request->station_id)
            ->firstOrFail();

        $dateFacture = Carbon::parse($request->date_facture);
        $dateDebut   = Carbon::parse($contrat->date_debut);

        // 1) ✅ Loyer fixe HT (augmentation annuelle cumulée par année complète)
        // Exemple: base=1500, pct=5%
        //  - >=1 an  => 1500 + 1*(1500*0.05)
        //  - >=2 ans => 1500 + 2*(1500*0.05)
        $loyerFixeBase = (float) $contrat->loyer_fix_ht;
        $pctAug = (float) ($contrat->augmentation_annuelle ?? 0);

        // nombre d'années complètes écoulées (0,1,2,...)
        $years = 0;
        if ($dateFacture->greaterThanOrEqualTo($dateDebut->copy()->addYear())) {
            // diffInYears = années complètes entre deux dates
            $years = $dateDebut->diffInYears($dateFacture);
        }

        $loyerFixeHT = $loyerFixeBase + ($years * ($loyerFixeBase * $pctAug / 100));

        // 2) Redevance variable
        $variableTTC  = (float) $request->variable_ttc;
        $variableHTVA = $variableTTC / 1.07;

        preg_match('/([\d\.]+)/', (string) $contrat->loyer_variable, $matches);
        $loyerVariablePct = isset($matches[1]) ? (float) $matches[1] : 0.0;

        $redevanceHTVA = $variableHTVA * ($loyerVariablePct / 100);
        $redevanceTTC  = $redevanceHTVA * 1.19;

        // 3) Divers optionnels
        $electriciteHT = (float) ($request->electricite_ht ?? 0);
        $eauHT         = (float) ($request->eau_ht ?? 0);
        $gazHT         = (float) ($request->gaz_ht ?? 0);
        $personnelHT   = (float) ($request->personnel_ht ?? 0);

        $chargeCompHT  = (float) ($request->charge_complementaire_ht ?? 0);
        $chargeCompComment = trim((string)($request->charge_complementaire_comment ?? ''));

        // 4) Totaux
        $totalHTVA = $loyerFixeHT + $redevanceHTVA
            + $electriciteHT + $eauHT + $gazHT + $personnelHT
            + $chargeCompHT;

        $tva19     = $totalHTVA * 0.19;
        $timber    = 1.0;
        $totalTTC  = $totalHTVA + $tva19 + $timber;

        // 5) Code facture base
        $stationNumero = str_pad((string)($contrat->station->numero ?? 0), 3, '0', STR_PAD_LEFT);
        $locataireNum  = str_pad((string)($contrat->locataire->num ?? 0), 2, '0', STR_PAD_LEFT);
        $moisNum       = str_pad((string)$request->mois, 2, '0', STR_PAD_LEFT);
        $annee         = (int)$dateFacture->format('Y');

        $baseFactureCode = $stationNumero . $locataireNum . $moisNum . $annee;

        // 6) Suffixe F/V/D
        $hasF = $loyerFixeHT > 0;
        $hasV = $redevanceHTVA > 0;
        $hasD = ($electriciteHT > 0) || ($eauHT > 0) || ($gazHT > 0) || ($personnelHT > 0) || ($chargeCompHT > 0);

        $suffix = '';
        if ($hasF) $suffix .= 'F';
        if ($hasV) $suffix .= 'V';
        if ($hasD) $suffix .= 'D';

        $codeParts = $this->buildUniqueCodeParts($baseFactureCode, $suffix);

        $r3 = fn($v) => round((float)$v, 3);

        return [
            // relations ids utiles pour stockage
            'contrat_id'   => $contrat->id,
            'locataire_id' => (int)$request->locataire_id,
            'station_id'   => (int)$request->station_id,

            // codes
            'facture_code'      => $codeParts['facture_code'],
            'facture_suffix'    => $codeParts['facture_suffix'],
            'facture_code_full' => $codeParts['facture_code_full'],

            // infos affichage
            'locataire' => $contrat->locataire->nom,
            'station'   => $contrat->station->nom,
            'mois'      => (int) $request->mois,
            'annee'     => $annee,
            'date'      => $request->date_facture,

            // inputs
            'variable_ttc' => $r3($variableTTC),

            // montants
            'loyer_fixe_ht'   => $r3($loyerFixeHT),
            'redevance_htva'  => $r3($redevanceHTVA),
            'redevance_ttc'   => $r3($redevanceTTC),

            'electricite_ht'  => $r3($electriciteHT),
            'eau_ht'          => $r3($eauHT),
            'gaz_ht'          => $r3($gazHT),
            'personnel_ht'    => $r3($personnelHT),

            'charge_complementaire_ht'       => $r3($chargeCompHT),
            'charge_complementaire_comment'  => $chargeCompComment,

            'total_htva' => $r3($totalHTVA),
            'tva_19'     => $r3($tva19),
            'timber'     => $r3($timber),
            'total_ttc'  => $r3($totalTTC),
        ];
    }

    public function calculate(Request $request)
    {
        $data = $this->computeData($request);
        return response()->json($data);
    }

    /**
     * ✅ Stocker lors de l’impression
     * - évite doublons via facture_code (unique)
     * - enregistre aussi les lignes
     */
    public function store(Request $request)
    {
        $data = $this->computeData($request);

        // Si déjà créée (même code), on renvoie l’existante
        $existing = Facture::where('facture_code', $data['facture_code'])->with('lignes')->first();
        if ($existing) {
            return response()->json([
                'stored' => true,
                'already_exists' => true,
                'facture' => $existing,
            ]);
        }

        // Créer header
        $facture = Facture::create([
            'contrat_id'   => $data['contrat_id'],
            'locataire_id' => $data['locataire_id'],
            'station_id'   => $data['station_id'],
            'mois'         => $data['mois'],
            'annee'        => $data['annee'],
            'date_facture' => $data['date'],

            'facture_code'      => $data['facture_code'],
            'facture_suffix'    => $data['facture_suffix'],
            'facture_code_full' => $data['facture_code_full'],

            'variable_ttc' => $data['variable_ttc'],

            'loyer_fixe_ht'  => $data['loyer_fixe_ht'],
            'redevance_htva' => $data['redevance_htva'],
            'redevance_ttc'  => $data['redevance_ttc'],

            'electricite_ht' => $data['electricite_ht'],
            'eau_ht'         => $data['eau_ht'],
            'gaz_ht'         => $data['gaz_ht'],
            'personnel_ht'   => $data['personnel_ht'],

            'charge_complementaire_ht'      => $data['charge_complementaire_ht'],
            'charge_complementaire_comment' => $data['charge_complementaire_comment'],

            'total_htva' => $data['total_htva'],
            'tva_19'     => $data['tva_19'],
            'timber'     => $data['timber'],
            'total_ttc'  => $data['total_ttc'],
            'status'     => 'EMISE',
        ]);

        // Créer lignes (uniquement si > 0)
        $lines = [];

        if ($data['loyer_fixe_ht'] > 0) {
            $lines[] = ['type' => 'FIXE', 'libelle' => 'Loyer fixe HTVA', 'montant_htva' => $data['loyer_fixe_ht']];
        }
        if ($data['redevance_htva'] > 0) {
            $lines[] = ['type' => 'VARIABLE', 'libelle' => 'Redevance HTVA', 'montant_htva' => $data['redevance_htva']];
        }
        if ($data['electricite_ht'] > 0) {
            $lines[] = ['type' => 'ELECTRICITE', 'libelle' => 'Consommation électricité HTVA', 'montant_htva' => $data['electricite_ht']];
        }
        if ($data['eau_ht'] > 0) {
            $lines[] = ['type' => 'EAU', 'libelle' => 'Consommation eau HTVA', 'montant_htva' => $data['eau_ht']];
        }
        if ($data['gaz_ht'] > 0) {
            $lines[] = ['type' => 'GAZ', 'libelle' => 'Consommation gaz HTVA', 'montant_htva' => $data['gaz_ht']];
        }
        if ($data['personnel_ht'] > 0) {
            $lines[] = ['type' => 'PERSONNEL', 'libelle' => 'Personnel HTVA', 'montant_htva' => $data['personnel_ht']];
        }
        if ($data['charge_complementaire_ht'] > 0) {
            $label = 'Charge complémentaire';
            if (!empty($data['charge_complementaire_comment'])) {
                $label .= ' (' . $data['charge_complementaire_comment'] . ')';
            }
            $label .= ' HTVA';
            $lines[] = ['type' => 'CHARGE_COMP', 'libelle' => $label, 'montant_htva' => $data['charge_complementaire_ht']];
        }

        foreach ($lines as $l) {
            $l['facture_id'] = $facture->id;
            FactureLigne::create($l);
        }

        $facture->load('lignes');

        return response()->json([
            'stored' => true,
            'already_exists' => false,
            'facture' => $facture,
        ]);
    }

    // Optionnel: voir une facture
    public function show($id)
    {
        $facture = Facture::with('lignes')->findOrFail($id);
        return response()->json($facture);
    }



public function stats(Request $request)
    {
        // Optionnel: tu peux filtrer par année si tu veux
        // $year = $request->query('year'); // ex: 2025
        // if ($year) ->whereYear('date_facture', $year)

        $base = Facture::query();

        // 1) Totaux globaux
        $globalCount = (clone $base)->count();
        $globalSumTtc = (clone $base)->sum('total_ttc');

        // 2) Totaux par mois (YYYY-MM)
        $byMonth = (clone $base)
            ->selectRaw("DATE_FORMAT(date_facture, '%Y-%m') as ym, COUNT(*) as count_factures, SUM(total_ttc) as sum_ttc")
            ->groupBy('ym')
            ->orderBy('ym', 'desc')
            ->get();

        // 3) Totaux par station
        $byStation = (clone $base)
            ->join('stations', 'factures.station_id', '=', 'stations.id')
            ->selectRaw("factures.station_id as station_id, stations.nom as station_nom, COUNT(*) as count_factures, SUM(factures.total_ttc) as sum_ttc")
            ->groupBy('factures.station_id', 'stations.nom')
            ->orderByDesc('sum_ttc')
            ->get();

        // 4) Totaux par locataire
        $byLocataire = (clone $base)
            ->join('locataires', 'factures.locataire_id', '=', 'locataires.id')
            ->selectRaw("factures.locataire_id as locataire_id, locataires.nom as locataire_nom, COUNT(*) as count_factures, SUM(factures.total_ttc) as sum_ttc")
            ->groupBy('factures.locataire_id', 'locataires.nom')
            ->orderByDesc('sum_ttc')
            ->get();

        return response()->json([
            'global' => [
                'count_factures' => (int) $globalCount,
                'sum_total_ttc' => (float) $globalSumTtc,
            ],
            'by_month' => $byMonth,
            'by_station' => $byStation,
            'by_locataire' => $byLocataire,
        ]);
    }

public function update(Request $request, $id)
{
    $facture = Facture::findOrFail($id);

    if (
        $request->has('status') &&
        !$request->has('locataire_id') &&
        !$request->has('station_id') &&
        !$request->has('date_facture') &&
        !$request->has('mois')
    ) {
        $data = $request->validate([
            'status' => 'required|string|in:EMISE,PAYEE,ANNULEE,IMPAYEE,EN_RETARD,REGROUPEE',
        ]);

        $facture->update([
            'status' => $data['status'],
        ]);

        return response()->json([
            'updated' => true,
            'facture' => $facture->fresh()->load('lignes'),
        ]);
    }

    $request->validate([
        'locataire_id' => 'required|exists:locataires,id',
        'station_id'   => 'required|exists:stations,id',
        'date_facture' => 'required|date',
        'mois'         => 'required|integer|min:1|max:12',
        'status'       => 'required|string|in:EMISE,PAYEE,ANNULEE,IMPAYEE,EN_RETARD',

        'loyer_fixe_ht'  => 'nullable|numeric|min:0',
        'redevance_htva' => 'nullable|numeric|min:0',
        'electricite_ht' => 'nullable|numeric|min:0',
        'eau_ht'         => 'nullable|numeric|min:0',
        'gaz_ht'         => 'nullable|numeric|min:0',
        'personnel_ht'   => 'nullable|numeric|min:0',
        'charge_complementaire_ht' => 'nullable|numeric|min:0',
        'charge_complementaire_comment' => 'nullable|string|max:120',
        'timber' => 'nullable|numeric|min:0',
    ]);

    DB::beginTransaction();

    try {

        $loyerFixe = (float)($request->loyer_fixe_ht ?? 0);
        $redevance = (float)($request->redevance_htva ?? 0);
        $elec = (float)($request->electricite_ht ?? 0);
        $eau = (float)($request->eau_ht ?? 0);
        $gaz = (float)($request->gaz_ht ?? 0);
        $pers = (float)($request->personnel_ht ?? 0);
        $comp = (float)($request->charge_complementaire_ht ?? 0);
        $timber = (float)($request->timber ?? 1);

        $totalHTVA = $loyerFixe + $redevance + $elec + $eau + $gaz + $pers + $comp;
        $tva19 = $totalHTVA * 0.19;
        $totalTTC = $totalHTVA + $tva19 + $timber;

        $facture->update([
            'locataire_id' => $request->locataire_id,
            'station_id'   => $request->station_id,
            'date_facture' => $request->date_facture,
            'mois'         => $request->mois,
            'annee'        => date('Y', strtotime($request->date_facture)),

            'loyer_fixe_ht'  => $loyerFixe,
            'redevance_htva' => $redevance,
            'electricite_ht' => $elec,
            'eau_ht'         => $eau,
            'gaz_ht'         => $gaz,
            'personnel_ht'   => $pers,
            'charge_complementaire_ht' => $comp,
            'charge_complementaire_comment' => $request->charge_complementaire_comment,
            'timber' => $timber,

            'total_htva' => $totalHTVA,
            'tva_19'     => $tva19,
            'total_ttc'  => $totalTTC,

            'status' => $request->status,
        ]);

        // 🔁 Recréer lignes
        FactureLigne::where('facture_id', $facture->id)->delete();

        $lines = [];

        if ($loyerFixe > 0)
            $lines[] = ['type'=>'FIXE','libelle'=>'Loyer fixe HTVA','montant_htva'=>$loyerFixe];

        if ($redevance > 0)
            $lines[] = ['type'=>'VARIABLE','libelle'=>'Redevance HTVA','montant_htva'=>$redevance];

        if ($elec > 0)
            $lines[] = ['type'=>'ELECTRICITE','libelle'=>'Electricité HTVA','montant_htva'=>$elec];

        if ($eau > 0)
            $lines[] = ['type'=>'EAU','libelle'=>'Eau HTVA','montant_htva'=>$eau];

        if ($gaz > 0)
            $lines[] = ['type'=>'GAZ','libelle'=>'Gaz HTVA','montant_htva'=>$gaz];

        if ($pers > 0)
            $lines[] = ['type'=>'PERSONNEL','libelle'=>'Personnel HTVA','montant_htva'=>$pers];

        if ($comp > 0)
            $lines[] = ['type'=>'CHARGE_COMP','libelle'=>'Charge complémentaire','montant_htva'=>$comp];

        foreach ($lines as $l) {
            $l['facture_id'] = $facture->id;
            FactureLigne::create($l);
        }

        DB::commit();

        return response()->json([
            'updated'=>true,
            'facture'=>$facture->load('lignes')
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['error'=>$e->getMessage()],500);
    }
}

public function destroy($id)
{
    $facture = Facture::findOrFail($id);

    FactureLigne::where('facture_id',$id)->delete();
    $facture->delete();

    return response()->json(['deleted'=>true]);
}




private function quarterFromMonth(int $month): int
{
    return (int) ceil($month / 3);
}

private function factureMonth(Facture $facture): int
{
    return (int) ($facture->mois ?: Carbon::parse($facture->date_facture)->format('m'));
}

private function factureYear(Facture $facture): int
{
    return (int) ($facture->annee ?: Carbon::parse($facture->date_facture)->format('Y'));
}

private function buildGroupedFactureCode(
    $stationId,
    $locataireId,
    int $quarter,
    int $year,
    float $loyerFixeHT,
    float $redevanceHTVA,
    float $electriciteHT,
    float $eauHT,
    float $gazHT,
    float $personnelHT,
    float $chargeCompHT
): array
{
    $station = Station::find($stationId);
    $locataire = Locataires::find($locataireId);

    $stationNumero = str_pad((string)($station->numero ?? 0), 3, '0', STR_PAD_LEFT);
    $locataireNum  = str_pad((string)($locataire->num ?? 0), 2, '0', STR_PAD_LEFT);

    $baseFactureCode = $stationNumero . $locataireNum . 'T' . $quarter . $year;

    $hasF = $loyerFixeHT > 0;
    $hasV = $redevanceHTVA > 0;
    $hasD = ($electriciteHT > 0) || ($eauHT > 0) || ($gazHT > 0) || ($personnelHT > 0) || ($chargeCompHT > 0);

    $suffix = '';
    if ($hasF) $suffix .= 'F';
    if ($hasV) $suffix .= 'V';
    if ($hasD) $suffix .= 'D';

    return $this->buildUniqueCodeParts($baseFactureCode, $suffix);
}

public function regrouperFactures(Request $request)
{
    $request->validate([
        'facture_ids' => 'required|array|min:2',
        'facture_ids.*' => 'required|exists:factures,id',
        'date_facture' => 'nullable|date',
    ]);

    DB::beginTransaction();

    try {
        $factures = Facture::with(['locataire', 'station', 'contrat', 'lignes'])
            ->whereIn('id', $request->facture_ids)
            ->lockForUpdate()
            ->get();

        if ($factures->count() < 2) {
            return response()->json([
                'message' => 'Il faut sélectionner au moins 2 factures.'
            ], 422);
        }

        $first = $factures->first();
        $quarter = $this->quarterFromMonth($this->factureMonth($first));
        $year = $this->factureYear($first);

        foreach ($factures as $f) {
            if ((int)$f->locataire_id !== (int)$first->locataire_id) {
                return response()->json([
                    'message' => 'Toutes les factures sélectionnées doivent appartenir au même locataire.'
                ], 422);
            }

            if ((int)$f->station_id !== (int)$first->station_id) {
                return response()->json([
                    'message' => 'Toutes les factures sélectionnées doivent appartenir à la même station.'
                ], 422);
            }

            if (in_array($f->status, ['REGROUPEE', 'ANNULEE'])) {
                return response()->json([
                    'message' => "Une des factures est déjà regroupée ou annulée."
                ], 422);
            }

            $factureQuarter = $this->quarterFromMonth($this->factureMonth($f));
            $factureYear = $this->factureYear($f);

            if ($factureQuarter !== $quarter || $factureYear !== $year) {
                return response()->json([
                    'message' => 'Toutes les factures sÃ©lectionnÃ©es doivent appartenir au mÃªme trimestre et Ã  la mÃªme annÃ©e.'
                ], 422);
            }
        }

        $dateFacture = $request->date_facture
            ? Carbon::parse($request->date_facture)
            : now();

        $periodeDebut = $factures->min('date_facture');
        $periodeFin = $factures->max('date_facture');

        $loyerFixeHT = round((float)$factures->sum('loyer_fixe_ht'), 3);
        $redevanceHTVA = round((float)$factures->sum('redevance_htva'), 3);
        $redevanceTTC = round((float)$factures->sum('redevance_ttc'), 3);

        $electriciteHT = round((float)$factures->sum('electricite_ht'), 3);
        $eauHT = round((float)$factures->sum('eau_ht'), 3);
        $gazHT = round((float)$factures->sum('gaz_ht'), 3);
        $personnelHT = round((float)$factures->sum('personnel_ht'), 3);
        $chargeCompHT = round((float)$factures->sum('charge_complementaire_ht'), 3);

        $variableTTC = round((float)$factures->sum('variable_ttc'), 3);

        $comments = $factures
            ->pluck('charge_complementaire_comment')
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $chargeCompComment = count($comments) ? implode(' | ', $comments) : 'Facturation regroupée';

        $totalHTVA = round(
            $loyerFixeHT + $redevanceHTVA + $electriciteHT + $eauHT + $gazHT + $personnelHT + $chargeCompHT,
            3
        );

        $tva19 = round($totalHTVA * 0.19, 3);
        $timber = 1.000; // toujours 1 DT
        $totalTTC = round($totalHTVA + $tva19 + $timber, 3);

        $codeData = $this->buildGroupedFactureCode(
            $first->station_id,
            $first->locataire_id,
            $quarter,
            $year,
            $loyerFixeHT,
            $redevanceHTVA,
            $electriciteHT,
            $eauHT,
            $gazHT,
            $personnelHT,
            $chargeCompHT
        );

        $newFacture = Facture::create([
            'contrat_id'   => $first->contrat_id,
            'locataire_id' => $first->locataire_id,
            'station_id'   => $first->station_id,

            'mois'         => (int)$dateFacture->format('m'),
            'annee'        => $year,
            'date_facture' => $dateFacture->toDateString(),

            'facture_code'      => $codeData['facture_code'],
            'facture_suffix'    => $codeData['facture_suffix'],
            'facture_code_full' => $codeData['facture_code_full'],

            'variable_ttc' => $variableTTC,

            'loyer_fixe_ht'  => $loyerFixeHT,
            'redevance_htva' => $redevanceHTVA,
            'redevance_ttc'  => $redevanceTTC,

            'electricite_ht' => $electriciteHT,
            'eau_ht'         => $eauHT,
            'gaz_ht'         => $gazHT,
            'personnel_ht'   => $personnelHT,

            'charge_complementaire_ht'      => $chargeCompHT,
            'charge_complementaire_comment' => $chargeCompComment,

            'total_htva' => $totalHTVA,
            'tva_19'     => $tva19,
            'timber'     => $timber,
            'total_ttc'  => $totalTTC,

            'status' => 'EMISE',

            'type_facture' => 'REGROUPEE',
            'periode_debut' => $periodeDebut,
            'periode_fin' => $periodeFin,
        ]);

        $lignes = [];

        if ($loyerFixeHT > 0) {
            $lignes[] = [
                'facture_id' => $newFacture->id,
                'type' => 'FIXE',
                'libelle' => 'Loyer fixe HTVA regroupé',
                'montant_htva' => $loyerFixeHT,
            ];
        }

        if ($redevanceHTVA > 0) {
            $lignes[] = [
                'facture_id' => $newFacture->id,
                'type' => 'VARIABLE',
                'libelle' => 'Redevance HTVA regroupée',
                'montant_htva' => $redevanceHTVA,
            ];
        }

        if ($electriciteHT > 0) {
            $lignes[] = [
                'facture_id' => $newFacture->id,
                'type' => 'ELECTRICITE',
                'libelle' => 'Consommation électricité HTVA regroupée',
                'montant_htva' => $electriciteHT,
            ];
        }

        if ($eauHT > 0) {
            $lignes[] = [
                'facture_id' => $newFacture->id,
                'type' => 'EAU',
                'libelle' => 'Consommation eau HTVA regroupée',
                'montant_htva' => $eauHT,
            ];
        }

        if ($gazHT > 0) {
            $lignes[] = [
                'facture_id' => $newFacture->id,
                'type' => 'GAZ',
                'libelle' => 'Consommation gaz HTVA regroupée',
                'montant_htva' => $gazHT,
            ];
        }

        if ($personnelHT > 0) {
            $lignes[] = [
                'facture_id' => $newFacture->id,
                'type' => 'PERSONNEL',
                'libelle' => 'Personnel HTVA regroupé',
                'montant_htva' => $personnelHT,
            ];
        }

        if ($chargeCompHT > 0) {
            $lignes[] = [
                'facture_id' => $newFacture->id,
                'type' => 'CHARGE_COMP',
                'libelle' => 'Charge complémentaire regroupée',
                'montant_htva' => $chargeCompHT,
            ];
        }

        foreach ($lignes as $ligne) {
            FactureLigne::create($ligne);
        }

        foreach ($factures as $oldFacture) {
            DB::table('facture_regroupement_lignes')->insert([
                'facture_regroupee_id' => $newFacture->id,
                'facture_source_id' => $oldFacture->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $oldFacture->update([
                'status' => 'REGROUPEE',
                'parent_regroupement_id' => $newFacture->id,
            ]);
        }

        DB::commit();

        return response()->json([
            'grouped' => true,
            'facture' => $newFacture->load(['lignes', 'locataire', 'station', 'contrat']),
            'source_ids' => $factures->pluck('id')->values(),
        ]);
    } catch (\Throwable $e) {
        DB::rollBack();

        return response()->json([
            'message' => 'Erreur lors du regroupement des factures.',
            'error' => $e->getMessage(),
        ], 500);
    }
}






}
