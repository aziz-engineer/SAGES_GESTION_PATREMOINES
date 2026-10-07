<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTenantRequest;
use App\Http\Requests\UpdateTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    // GET /api/tenants?search=amine&station=MONASTIR&sort=-date_fin&page=1
    public function index(Request $request)
    {
        $q = Tenant::query();

        if ($s = $request->string('search')->trim()) {
            $q->where(function($qq) use ($s) {
                $qq->where('name', 'like', "%$s%")
                   ->orWhere('objet', 'like', "%$s%")
                   ->orWhere('station', 'like', "%$s%");
            });
        }

        if ($station = $request->string('station')->trim()) {
            $q->where('station', 'like', "%$station%");
        }

        // tri: ?sort=field ou ?sort=-field (desc)
        if ($sort = $request->string('sort')->trim()) {
            $dir = 'asc';
            $field = $sort;
            if (str_starts_with($sort, '-')) {
                $dir = 'desc';
                $field = substr($sort, 1);
            }
            if (in_array($field, [
                'num','name','date_debut','date_fin','loyer_fix_ht','augmentation_annuelle_pct'
            ])) {
                $q->orderBy($field, $dir);
            }
        } else {
            $q->orderBy('num');
        }

        return TenantResource::collection($q->paginate(15));
    }

    public function store(StoreTenantRequest $request)
    {
        $tenant = Tenant::create($request->validated());
        return new TenantResource($tenant);
    }

    public function show(Tenant $tenant)
    {
        return new TenantResource($tenant);
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant)
    {
        $tenant->update($request->validated());
        return new TenantResource($tenant);
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();
        return response()->noContent();
    }
}
