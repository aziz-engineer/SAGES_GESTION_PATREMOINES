<?php

namespace App\Http\Controllers;

use App\Models\Locataire;
use Illuminate\Http\Request;

class LocataireController extends Controller
{
    // GET /api/locataires
    public function index(Request $request)
    {
        $q = Locataire::query();

        if ($request->filled('locataire')) {
            $q->where('locataire', 'like', '%'.$request->query('locataire').'%');
        }
        if ($request->filled('station')) {
            $q->where('station', 'like', '%'.$request->query('station').'%');
        }
        if ($request->filled('operationnel')) {
            $bool = $this->toBool($request->query('operationnel'));
            $q->where('operationnel', $bool);
        }

        return $q->orderBy('id', 'desc')->paginate(20);
    }

    // POST /api/locataires
    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['operationnel'] = $this->toBool($request->input('operationnel'));
        $data['loyer_fix_mois_ht'] = $this->toDecimal($request->input('loyer_fix_mois_ht'));
        $data['augmentation_annuelle'] = $this->toDecimal($request->input('augmentation_annuelle'));

        $loc = Locataire::create($data);
        return response()->json($loc, 201);
    }

    // GET /api/locataires/{locataire}
    public function show(Locataire $locataire)
    {
        return $locataire;
    }

    // PUT/PATCH /api/locataires/{locataire}
    public function update(Request $request, Locataire $locataire)
    {
        $data = $this->validateData($request, updating: true);

        if ($request->has('operationnel')) {
            $data['operationnel'] = $this->toBool($request->input('operationnel'));
        }
        if ($request->has('loyer_fix_mois_ht')) {
            $data['loyer_fix_mois_ht'] = $this->toDecimal($request->input('loyer_fix_mois_ht'));
        }
        if ($request->has('augmentation_annuelle')) {
            $data['augmentation_annuelle'] = $this->toDecimal($request->input('augmentation_annuelle'));
        }

        $locataire->update($data);
        return $locataire;
    }
public function destroy($id)
{
    $affected = \App\Models\Locataire::whereKey($id)->delete(); // renvoie nb de lignes supprimées (0 ou 1)
    return response()->json([
        'deleted' => $affected > 0,
        'rows_affected' => $affected
    ]);
}

    // ------------ Helpers ------------
    private function validateData(Request $request, bool $updating = false): array
    {
        return $request->validate([
            'numero'                => ['nullable', 'integer'],
            'locataire'             => [$updating ? 'sometimes' : 'required', 'string', 'max:255'],
            'date_debut'            => ['nullable', 'date'],
            'duree'                 => ['nullable', 'string', 'max:100'],
            'date_fin'              => ['nullable', 'date'],
            'operationnel'          => [$updating ? 'sometimes' : 'nullable'], // "OUI/NON/true/false"
            'objet'                 => ['nullable', 'string', 'max:255'],
            'station'               => ['nullable', 'string', 'max:255'],
            'loyer_fix_mois_ht'     => ['nullable'],
            'augmentation_annuelle' => ['nullable'],
            'loyer_variable'        => ['nullable', 'string', 'max:255'],
        ]);
    }

    private function toBool($value): bool
    {
        if (is_bool($value)) return $value;
        $v = strtoupper(trim((string)$value));
        return in_array($v, ['1','TRUE','OUI','YES'], true);
    }

    private function toDecimal($value): ?float
    {
        if ($value === null || $value === '') return null;
        // Nettoyage : "1 500,300", "5%", "29750 DT TTC"
        $s = str_replace([' ', 'DT', 'TTC', '%'], '', (string)$value);
        $s = str_replace(',', '.', $s);
        if (preg_match('/-?\d+(\.\d+)?/', $s, $m)) {
            return (float)$m[0];
        }
        return null;
    }
}
