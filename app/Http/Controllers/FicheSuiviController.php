<?php

namespace App\Http\Controllers;

use App\Models\FicheSuivi;
use App\Models\Tenant;

use Illuminate\Http\Request;

class FicheSuiviController extends Controller
{
    // Liste des fiches d’un locataire
    public function index($tenant_id)
    {
        return FicheSuivi::where('tenant_id', $tenant_id)->get();
    }

    // Ajouter une fiche
   public function store(Request $request, Tenant $tenant)
{
    $validated = $request->validate([
        'date' => 'required|date',
        'types' => 'nullable|array',

        'redevance_fixe.montant_ht' => 'nullable|numeric',
        'redevance_fixe.date_echeance' => 'nullable|date',
        'redevance_fixe.date_paiement' => 'nullable|date',

        'redevance_variable.ca_ttc' => 'nullable|numeric',
        'redevance_variable.ca_taxable_ht' => 'nullable|numeric',
        'redevance_variable.ca_com_v_ht' => 'nullable|numeric',
        'redevance_variable.date_echeance' => 'nullable|date',
        'redevance_variable.date_paiement' => 'nullable|date',

        'consommation.electricite.quantite' => 'nullable|numeric',
        'consommation.electricite.prix_total_ht' => 'nullable|numeric',

        'consommation.gaz.quantite' => 'nullable|numeric',
        'consommation.gaz.prix_total_ht' => 'nullable|numeric',

        'consommation.eau.quantite' => 'nullable|numeric',
        'consommation.eau.prix_total_ht' => 'nullable|numeric',
    ]);

    $fiche = FicheSuivi::create([
        'tenant_id' => $tenant->id,
        'date' => $validated['date'],
        'types' => $validated['types'] ?? [],
        'redevance_fixe' => $validated['redevance_fixe'] ?? null,
        'redevance_variable' => $validated['redevance_variable'] ?? null,
        'consommation' => $validated['consommation'] ?? null,
    ]);

    return response()->json($fiche, 201);
}

    // Afficher une fiche
    public function show($id)
    {
        return FicheSuivi::findOrFail($id);
    }

    // Modifier une fiche
    public function update(Request $request, $id)
    {
        $fiche = FicheSuivi::findOrFail($id);

        $data = $request->all();
        $data['types'] = $request->input('types', []);

        $fiche->update($data);

        return response()->json($fiche);
    }

    // Supprimer une fiche
    public function destroy($id)
    {
        FicheSuivi::destroy($id);
        return response()->json(['message' => 'Fiche supprimée']);
    }
}
