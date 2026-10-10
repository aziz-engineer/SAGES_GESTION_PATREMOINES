<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use LogicException;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $connection = config('database.connections.'.config('database.default'), []);
        $databaseUrl = $connection['url'] ?? null;
        $urlHost = is_string($databaseUrl) ? parse_url($databaseUrl, PHP_URL_HOST) : null;
        $host = $urlHost ?: ($connection['host'] ?? null);
        $isLocalSqlite = ($connection['driver'] ?? null) === 'sqlite';
        $isLoopback = is_string($host)
            && in_array(strtolower($host), ['127.0.0.1', 'localhost', '::1'], true);

        if (app()->environment('production') || (!$isLocalSqlite && !$isLoopback)) {
            throw new LogicException('Demo data may only be seeded into a local development database.');
        }

        DB::transaction(function (): void {
            $now = now();

            $stationNames = [
                'SAGES Siège',
                'SNDP',
                'Béja',
                'Ariana',
                'Kairouan',
                'Kantaoui',
                'Sousse',
            ];

            foreach ($stationNames as $index => $name) {
                $number = sprintf('DEMO-ST-%03d', $index + 1);
                $this->upsert('stations', ['numero' => $number], [
                    'nom' => 'DEMO - '.$name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $agilStationNames = ['Ariana', 'Béja', 'Kairouan', 'Kantaoui', 'Sousse'];
            $agilStations = [];
            foreach ($agilStationNames as $index => $location) {
                $number = sprintf('DEMO-AGIL-%03d', $index + 1);
                $this->upsert('stations', ['numero' => $number], [
                    'nom' => 'DEMO - AGIL '.$location,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $agilStations[] = DB::table('stations')->where('numero', $number)->value('id');
            }

            $familyNames = ['Immobilier', 'Mobilier', 'Informatique', 'Équipement technique'];
            $families = [];
            foreach ($familyNames as $index => $name) {
                $number = sprintf('DEMO-FAM-%03d', $index + 1);
                $this->upsert('familles', ['numero' => $number], [
                    'nom' => 'DEMO - '.$name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $families[] = DB::table('familles')->where('numero', $number)->value('id');
            }

            $subfamilies = [
                ['Bâtiment', 0],
                ['Bureau', 1],
                ['Ordinateur', 2],
                ['Climatisation', 3],
            ];
            foreach ($subfamilies as $index => [$name, $familyIndex]) {
                $number = sprintf('DEMO-SF-%03d', $index + 1);
                $this->upsert('sousfams', ['numero' => $number], [
                    'nom' => 'DEMO - '.$name,
                    'famille_id' => $families[$familyIndex],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $demoTenantIds = [];
            $invoiceIds = [];
            $invoiceTotals = [];
            $invoiceDate = now()->startOfMonth()->subMonth();

            foreach ($agilStations as $index => $stationId) {
                $sequence = $index + 1;
                $name = sprintf('DEMO - Entreprise locataire %02d', $sequence);
                $number = sprintf('DEMO-LOC-%03d', $sequence);

                $this->upsert('locataires', ['num' => $number], [
                    'nom' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $locataireId = DB::table('locataires')->where('num', $number)->value('id');

                $this->upsert('fichelocs', ['matricule_fiscale' => 'DEMO-FISCAL-'.sprintf('%03d', $sequence)], [
                    'locataire_id' => $locataireId,
                    'station_id' => $stationId,
                    'adresse_facturation' => 'Adresse fictive de démonstration',
                    'contact' => 'Contact fictif',
                    'num_tel' => null,
                    'fax' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $contractNumber = sprintf('DEMO-CONTRAT-%03d', $sequence);
                $this->upsert('contrats', [
                    'locataire_id' => $locataireId,
                    'station_id' => $stationId,
                ], [
                    'date_debut' => now()->startOfMonth()->subMonths(2)->toDateString(),
                    'duree' => 12,
                    'date_fin' => now()->startOfMonth()->addMonths(10)->toDateString(),
                    'objet' => $contractNumber.' - données fictives',
                    'loyer_fix_ht' => 450 + ($sequence * 25),
                    'augmentation_annuelle' => 2.00,
                    'loyer_variable' => 'DEMO - 5% fictif',
                    'minimum_garantie' => 'DEMO - montant fictif',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $contractId = DB::table('contrats')
                    ->where('locataire_id', $locataireId)
                    ->where('station_id', $stationId)
                    ->value('id');

                $totalHt = 500 + ($sequence * 25);
                $tax = round($totalHt * 0.19, 3);
                $totalTtc = $totalHt + $tax + 1;
                $invoiceCode = sprintf('DEMO-FAC-%s-%03d', $invoiceDate->format('Ym'), $sequence);

                $this->upsert('factures', ['facture_code' => $invoiceCode], [
                    'contrat_id' => $contractId,
                    'locataire_id' => $locataireId,
                    'station_id' => $stationId,
                    'mois' => $invoiceDate->month,
                    'annee' => $invoiceDate->year,
                    'date_facture' => $invoiceDate->toDateString(),
                    'facture_suffix' => 'DEMO',
                    'facture_code_full' => $invoiceCode.' - FICTIVE',
                    'variable_ttc' => 0,
                    'loyer_fixe_ht' => $totalHt,
                    'redevance_htva' => $totalHt,
                    'redevance_ttc' => $totalTtc,
                    'electricite_ht' => 0,
                    'eau_ht' => 0,
                    'gaz_ht' => 0,
                    'personnel_ht' => 0,
                    'charge_complementaire_ht' => 0,
                    'charge_complementaire_comment' => 'DEMO - charge fictive',
                    'total_htva' => $totalHt,
                    'tva_19' => $tax,
                    'timber' => 1,
                    'total_ttc' => $totalTtc,
                    'status' => 'EMISE',
                    'type_facture' => 'NORMALE',
                    'parent_regroupement_id' => null,
                    'periode_debut' => $invoiceDate->copy()->startOfMonth()->toDateString(),
                    'periode_fin' => $invoiceDate->copy()->endOfMonth()->toDateString(),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $invoiceId = DB::table('factures')->where('facture_code', $invoiceCode)->value('id');
                $invoiceIds[] = $invoiceId;
                $invoiceTotals[] = $totalTtc;
                $this->upsert('facture_lignes', [
                    'facture_id' => $invoiceId,
                    'type' => 'FIXE',
                ], [
                    'libelle' => 'DEMO - Redevance fictive',
                    'montant_htva' => $totalHt,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $this->upsert('patrimoines', ['code_inventaire' => sprintf('DEMO-INV-%03d', $sequence)], [
                    'station_id' => $stationId,
                    'designation' => 'DEMO - équipement de bureau fictif',
                    'categorie' => 'DEMO - Mobilier',
                    'marque' => 'DEMO',
                    'modele' => 'Modèle fictif',
                    'numero_serie' => sprintf('DEMO-SERIE-%03d', $sequence),
                    'etat' => 'Bon',
                    'statut' => 'En service',
                    'date_acquisition' => $invoiceDate->toDateString(),
                    'valeur_achat' => $invoiceDate->toDateString(),
                    'fournisseur' => 'DEMO - fournisseur fictif',
                    'garantie_fin' => $invoiceDate->copy()->addYear()->toDateString(),
                    'prochaine_maintenance' => now()->addMonths(6)->toDateString(),
                    'criticite' => 'Moyenne',
                    'responsable' => 'DEMO - responsable fictif',
                    'notes' => 'Donnée de démonstration fictive, ne correspond pas à un bien réel.',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $legacyNumber = 9000 + $sequence;
                $this->upsert('locataire', [
                    'numero' => $legacyNumber,
                    'locataire' => $name,
                    'station' => 'DEMO - station fictive',
                ], [
                    'date_debut' => now()->startOfMonth()->subMonths(2)->toDateString(),
                    'duree' => 'DEMO - 12 mois',
                    'date_fin' => now()->startOfMonth()->addMonths(10)->toDateString(),
                    'operationnel' => true,
                    'objet' => 'DEMO - contrat fictif',
                    'loyer_fix_mois_ht' => $totalHt,
                    'augmentation_annuelle' => 0.02,
                    'loyer_variable' => 'DEMO - 5% fictif',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $demoTenantNumber = 8000 + $sequence;
                $this->upsert('tenants', [
                    'num' => $demoTenantNumber,
                    'name' => $name,
                ], [
                    'date_debut' => now()->startOfMonth()->subMonths(2)->toDateString(),
                    'duree_mois' => 12,
                    'date_fin' => now()->startOfMonth()->addMonths(10)->toDateString(),
                    'operation' => true,
                    'objet' => 'DEMO - activité fictive',
                    'station' => 'DEMO - AGIL '.['Ariana', 'Béja', 'Kairouan', 'Kantaoui', 'Sousse'][$index],
                    'loyer_fix_ht' => $totalHt,
                    'augmentation_annuelle_pct' => 2.00,
                    'loyer_variable_pct' => 5.00,
                    'minimum_garanti_ttc' => $totalTtc,
                    'minimum_garanti_note' => 'DEMO - montant fictif',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $demoTenantIds[] = DB::table('tenants')
                    ->where('num', $demoTenantNumber)
                    ->where('name', $name)
                    ->value('id');
            }

            foreach ($demoTenantIds as $index => $tenantId) {
                $this->upsert('fiches_suivi', ['tenant_id' => $tenantId], [
                    'date' => $invoiceDate->toDateString(),
                    'types' => json_encode(['FIXE', 'VARIABLE'], JSON_THROW_ON_ERROR),
                    'montant_ht' => 500 + (($index + 1) * 25),
                    'date_echeance' => $invoiceDate->copy()->addMonth()->toDateString(),
                    'date_paiement' => null,
                    'ca_ttc' => 0,
                    'ca_taxable_ht' => 0,
                    'ca_com_v_ht' => 0,
                    'ca_date_echeance' => $invoiceDate->copy()->addMonth()->toDateString(),
                    'ca_date_paiement' => null,
                    'elec_quantite' => 0,
                    'elec_prix_total_ht' => 0,
                    'gaz_quantite' => 0,
                    'gaz_prix_total_ht' => 0,
                    'eau_quantite' => 0,
                    'eau_prix_total_ht' => 0,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $paymentNumber = 'DEMO-REG-001';
            $this->upsert('reglements', ['num_reglement' => $paymentNumber], [
                'facture_id' => $invoiceIds[0],
                'locataire_id' => DB::table('locataires')->where('num', 'DEMO-LOC-001')->value('id'),
                'station_id' => $agilStations[0],
                'mode_paiement' => 'VIREMENT',
                'reference_paiement' => 'DEMO - référence fictive',
                'banque' => 'DEMO - banque fictive',
                'date_reglement' => now()->toDateString(),
                'date_echeance' => now()->addMonth()->toDateString(),
                'montant_facture' => $invoiceTotals[0],
                'montant_paye' => 100,
                'montant_restant' => $invoiceTotals[0] - 100,
                'statut_traitement' => 'NON_TRAITE',
                'traite_par' => null,
                'traite_le' => null,
                'statut' => 'PARTIEL',
                'observation' => 'DEMO - paiement fictif, ne correspond pas à une transaction réelle.',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });
    }

    private function upsert(string $table, array $uniqueBy, array $values): void
    {
        DB::table($table)->updateOrInsert($uniqueBy, $values);
    }
}
