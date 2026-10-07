<?php

namespace App\Http\Controllers;

use App\Models\Famille;
use App\Models\Patrimoine;
use App\Models\Sousfam;
use App\Models\Station;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PatrimoineController extends Controller
{
    public function index(Request $request)
    {
        $query = Patrimoine::with('station')
            ->when($request->filled('station_id'), function ($builder) use ($request) {
                $builder->where('station_id', $request->station_id);
            })
            ->when($request->filled('etat'), function ($builder) use ($request) {
                $builder->where('etat', $request->etat);
            })
            ->when($request->filled('statut'), function ($builder) use ($request) {
                $builder->where('statut', $request->statut);
            })
            ->when($request->filled('criticite'), function ($builder) use ($request) {
                $builder->where('criticite', $request->criticite);
            })
            ->when($request->filled('q'), function ($builder) use ($request) {
                $search = trim($request->q);
                $builder->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('designation', 'like', "%{$search}%")
                        ->orWhere('code_inventaire', 'like', "%{$search}%")
                        ->orWhere('categorie', 'like', "%{$search}%")
                        ->orWhere('marque', 'like', "%{$search}%")
                        ->orWhere('modele', 'like', "%{$search}%")
                        ->orWhere('numero_serie', 'like', "%{$search}%")
                        ->orWhere('responsable', 'like', "%{$search}%")
                        ->orWhereHas('station', function ($stationQuery) use ($search) {
                            $stationQuery
                                ->where('nom', 'like', "%{$search}%")
                                ->orWhere('numero', 'like', "%{$search}%");
                        });
                });
            })
            ->latest();

        $patrimoines = $query->get();
        $today = now()->startOfDay();

        $stats = [
            'total' => $patrimoines->count(),
            'in_service' => $patrimoines->where('statut', 'En service')->count(),
            'maintenance_due' => $patrimoines
                ->filter(fn ($item) => $item->prochaine_maintenance && $item->prochaine_maintenance->lte($today->copy()->addDays(30)))
                ->count(),
            'warranty_expiring' => $patrimoines
                ->filter(fn ($item) => $item->garantie_fin && $item->garantie_fin->gte($today) && $item->garantie_fin->lte($today->copy()->addDays(60)))
                ->count(),
            'critical_assets' => $patrimoines->where('criticite', 'Critique')->count(),
        ];

        return response()->json([
            'data' => $patrimoines,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $patrimoine = DB::transaction(function () use ($validated) {
            // placeholder to satisfy the NOT NULL/unique column until the real id is known
            $patrimoine = Patrimoine::create(array_merge($validated, [
                'code_inventaire' => 'TMP-' . Str::uuid(),
            ]));

            $patrimoine->code_inventaire = $this->generateCodeInventaire($patrimoine, $validated);
            $patrimoine->save();

            return $patrimoine;
        });

        return response()->json($patrimoine->load('station'), 201);
    }

    public function show($id)
    {
        return Patrimoine::with('station')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $patrimoine = Patrimoine::findOrFail($id);
        $validated = $this->validatePayload($request);

        $patrimoine->fill($validated);
        $patrimoine->code_inventaire = $this->generateCodeInventaire($patrimoine, $validated);
        $patrimoine->save();

        return response()->json($patrimoine->load('station'));
    }

    public function destroy($id)
    {
        $patrimoine = Patrimoine::findOrFail($id);
        $patrimoine->delete();

        return response()->json([
            'message' => 'Patrimoine supprime avec succes.',
        ]);
    }

    /**
     * Code inventaire = XX-YYY-ZZZZ-WWW
     * XX: code famille, YYY: code sous-famille, ZZZZ: numero d'ordre (= id, 4 chiffres), WWW: code station.
     * Regenerated on every save, so a station transfer alone only changes the WWW segment.
     */
    private function generateCodeInventaire(Patrimoine $patrimoine, array $validated): string
    {
        $famille = Famille::where('nom', $validated['designation'])->first();
        $sousfam = Sousfam::where('nom', $validated['categorie'])
            ->when($famille, fn ($query) => $query->where('famille_id', $famille->id))
            ->first();
        $station = Station::find($validated['station_id']);

        $familleCode = $famille->numero ?? 'XX';
        $sousfamCode = $sousfam->numero ?? 'YYY';
        $stationCode = $station->numero ?? 'WWW';
        $ordre = str_pad((string) $patrimoine->id, 4, '0', STR_PAD_LEFT);

        return "{$familleCode}-{$sousfamCode}-{$ordre}-{$stationCode}";
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'station_id' => ['required', 'exists:stations,id'],
            'designation' => ['required', 'string', 'max:255'],
            'categorie' => ['required', 'string', 'max:100'],
            'marque' => ['required', 'string', 'max:100'],
            'modele' => ['nullable', 'string', 'max:100'],
            'numero_serie' => ['nullable', 'string', 'max:100'],
            'etat' => ['required', Rule::in(['Excellent', 'Bon', 'Moyen', 'Critique'])],
            'statut' => ['required', Rule::in(['En service', 'En maintenance', 'En reserve', 'Hors service'])],
            'date_acquisition' => ['nullable', 'string', 'max:20', 'regex:/^\d+\/\d{4}$/'],
            'valeur_achat' => ['nullable', 'date', 'required_with:date_acquisition'],
            'fournisseur' => ['required', 'string', 'max:150'],
            'garantie_fin' => ['nullable', 'date'],
            'prochaine_maintenance' => ['nullable', 'date'],
            'criticite' => ['required', Rule::in(['Faible', 'Moyenne', 'Elevee', 'Critique'])],
            'responsable' => ['required', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'required_without:date_acquisition'],
        ]);
    }
}
