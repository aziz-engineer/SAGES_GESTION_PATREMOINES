import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Filter,
  Hourglass,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosClient from "../axios";
import { BarRankChart, TrendAreaChart } from "../components/charts/ReglementCharts";

const defaultForm = {
  facture_id: "",
  mode_paiement: "ESPECES",
  reference_paiement: "",
  banque: "",
  date_reglement: new Date().toISOString().slice(0, 10),
  date_echeance: "",
  montant_paye: "",
  rejete: false,
  traite: false,
  observation: "",
};

const modeOptions = [
  { value: "ESPECES", label: "Espèces", icon: Wallet },
  { value: "CHEQUE", label: "Chèque", icon: Receipt },
  { value: "VIREMENT", label: "Virement", icon: Repeat },
  { value: "TRAITE", label: "Traite", icon: Landmark },
  { value: "CARTE", label: "Carte bancaire", icon: CreditCard },
];

const statutLabels = {
  EN_ATTENTE: "En attente",
  PARTIEL: "Partiel",
  VALIDE: "Payé (OK)",
  REJETE: "Rejeté",
};

const statutTones = {
  EN_ATTENTE: "slate",
  PARTIEL: "amber",
  VALIDE: "emerald",
  REJETE: "rose",
};

// Teinte unique par graphique (comparaison de magnitude = 1 hue, validé CVD).
// Le 2e graphique de classement affiché simultanément prend la teinte suivante.
const CHART_HUE_ENCAISSEMENTS = "#2a78d6";
const CHART_HUE_IMPAYES = "#eb6834";

// Palette de la bulle de notification par statut de facture — mêmes tons que
// les badges de règlement (emerald=payé, amber=partiel, slate=attente, rose=retard).
const NOTIF_TONES = {
  emerald: {
    choice: "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100/70",
    iconWrap: "bg-emerald-600 text-white",
    badge: "bg-emerald-600 text-white",
    row: "border-emerald-200 bg-emerald-50",
    rowBadge: "bg-emerald-600 text-white",
    header: "bg-[linear-gradient(135deg,#0f172a_0%,#065f46_100%)]",
    accent: "text-emerald-700",
  },
  amber: {
    choice: "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100/70",
    iconWrap: "bg-amber-500 text-white",
    badge: "bg-amber-500 text-white",
    row: "border-amber-200 bg-amber-50",
    rowBadge: "bg-amber-500 text-white",
    header: "bg-[linear-gradient(135deg,#0f172a_0%,#92400e_100%)]",
    accent: "text-amber-700",
  },
  slate: {
    choice: "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/70",
    iconWrap: "bg-slate-600 text-white",
    badge: "bg-slate-600 text-white",
    row: "border-slate-200 bg-slate-50",
    rowBadge: "bg-slate-600 text-white",
    header: "bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_100%)]",
    accent: "text-slate-700",
  },
  rose: {
    choice: "border-rose-200 bg-rose-50 hover:border-rose-300 hover:bg-rose-100/70",
    iconWrap: "bg-rose-600 text-white",
    badge: "bg-rose-600 text-white",
    row: "border-rose-200 bg-rose-50",
    rowBadge: "bg-rose-600 text-white",
    header: "bg-[linear-gradient(135deg,#0f172a_0%,#9f1239_100%)]",
    accent: "text-rose-700",
  },
};

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

function money(value) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
}

function shortDate(value) {
  if (!value) return "Non définie";
  return new Date(value).toLocaleDateString("fr-FR");
}

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function modeLabel(value) {
  return modeOptions.find((m) => m.value === value)?.label || value;
}

function needsReference(mode) {
  return ["CHEQUE", "VIREMENT", "TRAITE"].includes(mode);
}

function needsEcheance(mode) {
  return ["CHEQUE", "TRAITE"].includes(mode);
}

function exportCsv(items) {
  const headers = [
    "N° règlement",
    "Facture",
    "Locataire",
    "Station",
    "Mode paiement",
    "Référence",
    "Date règlement",
    "Échéance",
    "Montant payé",
    "Reste à payer",
    "Statut",
    "Traitement",
  ];

  const rows = items.map((r) => [
    r.num_reglement,
    r.facture?.facture_code_full || r.facture?.facture_code || "",
    r.locataire?.nom || "",
    r.station?.nom || "",
    modeLabel(r.mode_paiement),
    r.reference_paiement || "",
    r.date_reglement || "",
    r.date_echeance || "",
    r.montant_paye ?? "",
    r.montant_restant ?? "",
    statutLabels[r.statut] || r.statut,
    r.statut_traitement === "TRAITE" ? "Traité" : "Non traité",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "reglements.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Reglements() {
  const [stations, setStations] = useState([]);
  const [factures, setFactures] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [alertes, setAlertes] = useState({ factures_en_retard: [], echeances_proches: [] });
  const [analytics, setAnalytics] = useState({ monthly: [], par_mode: [], top_impayes: [] });

  const [filters, setFilters] = useState({
    q: "",
    locataire_id: "",
    station_id: "",
    mode_paiement: "",
    statut: "",
    statut_traitement: "",
  });

  const [onlyUnpaid, setOnlyUnpaid] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [statusModal, setStatusModal] = useState(null);

  const fetchStatics = async () => {
    try {
      const { data } = await axiosClient.get("/stations");
      setStations(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      toast.error("Impossible de charger les stations.");
    }
  };

  const fetchFactures = async () => {
    try {
      const { data } = await axiosClient.get("/reglements/factures-disponibles");
      setFactures(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Impossible de charger la liste des factures.");
    }
  };

  const fetchReglements = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "")
      );
      const { data } = await axiosClient.get("/reglements", { params });
      setItems(data.data || []);
      setStats(data.stats || {});
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erreur de chargement des règlements.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertes = async () => {
    try {
      const { data } = await axiosClient.get("/reglements/alertes");
      setAlertes(data || { factures_en_retard: [], echeances_proches: [] });
    } catch (error) {
      // silencieux: les alertes ne doivent pas bloquer la page
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await axiosClient.get("/reglements/analytics");
      setAnalytics(data || { monthly: [], par_mode: [], top_impayes: [] });
    } catch (error) {
      // silencieux: les graphiques ne doivent pas bloquer la page
    }
  };

  useEffect(() => {
    fetchStatics();
    fetchFactures();
    fetchAlertes();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchReglements();
  }, [filters]);

  const locataires = useMemo(() => {
    const map = new Map();
    factures.forEach((f) => {
      if (f.locataire?.id) map.set(f.locataire.id, f.locataire);
    });
    return Array.from(map.values()).sort((a, b) => (a.nom || "").localeCompare(b.nom || ""));
  }, [factures]);

  const selectedFacture = useMemo(
    () => factures.find((f) => String(f.id) === String(form.facture_id)),
    [factures, form.facture_id]
  );

  const facturesForSelect = useMemo(() => {
    if (!onlyUnpaid) return factures;
    return factures.filter(
      (f) => f.montant_restant > 0 || String(f.id) === String(form.facture_id)
    );
  }, [factures, onlyUnpaid, form.facture_id]);

  const parModeChartData = useMemo(
    () => analytics.par_mode.map((m) => ({ label: modeLabel(m.mode), total: m.total })),
    [analytics.par_mode]
  );

  // Regroupe les factures par statut pour la bulle de notification: chaque
  // facture n'apparaît que dans une seule catégorie (le retard prime sur le reste).
  const statusCategories = useMemo(() => {
    const retardMap = new Map(alertes.factures_en_retard.map((r) => [r.id, r.jours_retard]));

    const payees = [];
    const partielles = [];
    const enAttente = [];
    const enRetard = [];

    factures.forEach((f) => {
      if (retardMap.has(f.id)) {
        enRetard.push({ ...f, jours_retard: retardMap.get(f.id) });
      } else if (f.status === "PAYEE") {
        payees.push(f);
      } else if (f.status === "PARTIELLE") {
        partielles.push(f);
      } else {
        enAttente.push(f);
      }
    });

    return [
      { key: "PAYEE", label: "Factures payées", tone: "emerald", icon: CheckCircle2, items: payees },
      { key: "PARTIELLE", label: "Partiellement payées", tone: "amber", icon: Hourglass, items: partielles },
      { key: "EN_ATTENTE", label: "En attente de paiement", tone: "slate", icon: Clock, items: enAttente },
      { key: "EN_RETARD", label: "Factures en retard", tone: "rose", icon: AlertTriangle, items: enRetard },
    ];
  }, [factures, alertes]);

  const notifBadgeCount = statusCategories.reduce(
    (total, cat) => (cat.key === "EN_RETARD" || cat.key === "PARTIELLE" ? total + cat.items.length : total),
    0
  );

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFilterChange = ({ target: { name, value } }) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const openCreateModal = (factureId) => {
    resetForm();
    if (factureId) {
      setForm((current) => ({ ...current, facture_id: String(factureId) }));
    }
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setFormOpen(false);
    resetForm();
  };

  const buildPayload = () => ({
    facture_id: Number(form.facture_id),
    mode_paiement: form.mode_paiement,
    reference_paiement: form.reference_paiement || null,
    banque: form.banque || null,
    date_reglement: form.date_reglement,
    date_echeance: form.date_echeance || null,
    montant_paye: Number(form.montant_paye),
    statut: form.rejete ? "REJETE" : null,
    statut_traitement: form.traite ? "TRAITE" : "NON_TRAITE",
    observation: form.observation || null,
  });

  const refreshAll = () => {
    fetchReglements();
    fetchFactures();
    fetchAlertes();
    fetchAnalytics();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = buildPayload();

      if (editingId) {
        await axiosClient.put(`/reglements/${editingId}`, payload);
        toast.success("Règlement mis à jour avec succès.");
      } else {
        await axiosClient.post("/reglements", payload);
        toast.success("Règlement enregistré avec succès.");
      }

      closeFormModal();
      refreshAll();
    } catch (error) {
      const apiErrors = error?.response?.data?.errors;
      const firstError = apiErrors
        ? Object.values(apiErrors).flat()[0]
        : error?.response?.data?.message;
      toast.error(firstError || "Impossible d'enregistrer le règlement.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      facture_id: String(item.facture_id ?? ""),
      mode_paiement: item.mode_paiement ?? "ESPECES",
      reference_paiement: item.reference_paiement ?? "",
      banque: item.banque ?? "",
      date_reglement: toInputDate(item.date_reglement) || new Date().toISOString().slice(0, 10),
      date_echeance: toInputDate(item.date_echeance),
      montant_paye: item.montant_paye ?? "",
      rejete: item.statut === "REJETE",
      traite: item.statut_traitement === "TRAITE",
      observation: item.observation ?? "",
    });
    setFormOpen(true);
  };

  const markTraite = async (item) => {
    try {
      await axiosClient.put(`/reglements/${item.id}/traiter`);
      toast.success("Règlement marqué comme traité.");
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Action impossible.");
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;

    try {
      await axiosClient.delete(`/reglements/${deleteTarget.id}`);
      toast.success("Règlement supprimé.");

      if (editingId === deleteTarget.id) resetForm();

      setDeleteTarget(null);
      setDetailsItem((current) => (current?.id === deleteTarget.id ? null : current));
      refreshAll();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Suppression impossible.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.14),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eefdf5_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HERO */}
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.75)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.35fr_0.65fr] lg:px-10 lg:py-10">
            <div className="relative">
              <div className="absolute -left-10 top-0 h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
                  <Sparkles size={14} />
                  Suivi des Règlements
                </div>
                <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Encaissements et paiements, pilotés en temps réel
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Enregistrez chaque règlement de facture, suivez les chèques et traites en attente, et
                  soyez alerté automatiquement sur les factures impayées.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openCreateModal()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                  >
                    <Plus size={18} />
                    Nouveau règlement
                  </button>
                  <button
                    type="button"
                    onClick={() => exportCsv(items)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <Receipt size={18} />
                    Exporter le registre
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[26px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Total encaissé
                    </div>
                    <div className="mt-2 text-3xl font-black text-emerald-300">
                      {money(stats.total_encaisse)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                    <PiggyBank size={22} />
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Reste à percevoir
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-amber-300">
                    {money(stats.total_restant)}
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Taux de recouvrement
                  </div>
                  <div className="text-lg font-black text-white">
                    {stats.taux_recouvrement ?? 0}%
                  </div>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    style={{ width: `${Math.min(stats.taux_recouvrement ?? 0, 100)}%` }}
                  />
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  {stats.factures_payees ?? 0} / {stats.factures_total ?? 0} factures soldées
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STAT CARDS */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CheckCircle2} label="Règlements validés" value={stats.nb_valide || 0} tone="emerald" />
          <StatCard icon={Clock} label="Partiels / en attente" value={(stats.nb_partiel || 0) + (stats.nb_en_attente || 0)} tone="amber" />
          <StatCard icon={XCircle} label="Rejetés" value={stats.nb_rejete || 0} tone="rose" />
          <StatCard icon={Bell} label="Non traités" value={stats.nb_non_traite || 0} tone="blue" />
        </section>

        {/* ANALYTICS */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
              Tendance
            </div>
            <h2 className="mt-2 text-xl font-black text-slate-900">
              Évolution des encaissements (12 derniers mois)
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              L'écart entre la ligne pointillée (facturé) et la zone verte (encaissé) est le montant restant à recouvrer.
            </p>
            <div className="mt-4">
              <TrendAreaChart data={analytics.monthly} moneyFormatter={money} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                Répartition
              </div>
              <h3 className="mt-2 text-base font-black text-slate-900">
                Encaissé par mode de paiement
              </h3>
              <div className="mt-4">
                <BarRankChart
                  data={parModeChartData}
                  color={CHART_HUE_ENCAISSEMENTS}
                  moneyFormatter={money}
                  emptyLabel="Aucun règlement enregistré."
                />
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-rose-700">
                Risque
              </div>
              <h3 className="mt-2 text-base font-black text-slate-900">
                Top impayés par locataire
              </h3>
              <div className="mt-4">
                <BarRankChart
                  data={analytics.top_impayes}
                  color={CHART_HUE_IMPAYES}
                  moneyFormatter={money}
                  emptyLabel="Aucun impayé, bravo !"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            {/* FILTERS */}
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">
                    Filtrage intelligent
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Recherche et tri</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                  <Filter size={14} />
                  {items.length} résultat(s)
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Recherche globale
                  </span>
                  <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <Search size={16} className="text-slate-400" />
                    <input
                      name="q"
                      value={filters.q}
                      onChange={handleFilterChange}
                      placeholder="N° règlement, référence, facture, locataire..."
                      className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 outline-none"
                    />
                  </div>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <FilterSelect label="Locataire" name="locataire_id" value={filters.locataire_id} onChange={handleFilterChange}>
                    <option value="">Tous</option>
                    {locataires.map((l) => (
                      <option key={l.id} value={l.id}>{l.nom}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect label="Station" name="station_id" value={filters.station_id} onChange={handleFilterChange}>
                    <option value="">Toutes</option>
                    {stations.map((s) => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect label="Mode de paiement" name="mode_paiement" value={filters.mode_paiement} onChange={handleFilterChange}>
                    <option value="">Tous</option>
                    {modeOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect label="Statut" name="statut" value={filters.statut} onChange={handleFilterChange}>
                    <option value="">Tous</option>
                    {Object.entries(statutLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect label="Traitement" name="statut_traitement" value={filters.statut_traitement} onChange={handleFilterChange}>
                    <option value="">Tous</option>
                    <option value="TRAITE">Traité</option>
                    <option value="NON_TRAITE">Non traité</option>
                  </FilterSelect>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => exportCsv(items)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({
                        q: "",
                        locataire_id: "",
                        station_id: "",
                        mode_paiement: "",
                        statut: "",
                        statut_traitement: "",
                      })
                    }
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Effacer filtres
                  </button>
                </div>
              </div>
            </div>

            {/* ALERTS: factures en retard */}
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-rose-700">
                    Alertes impayés
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Factures en retard</h2>
                </div>
                <div className="rounded-full bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700">
                  {alertes.factures_en_retard.length} alerte(s)
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {alertes.factures_en_retard.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Aucune facture en retard pour le moment.
                  </div>
                ) : (
                  alertes.factures_en_retard.slice(0, 5).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => openCreateModal(f.id)}
                      className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-left transition hover:border-rose-300 hover:bg-rose-100/60"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{f.facture_code}</div>
                          <div className="text-sm text-slate-600">
                            {f.locataire || "Locataire ?"} • {f.station || "Station ?"}
                          </div>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-rose-700">
                          {f.jours_retard} j. de retard
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                        <span>Facture émise le {shortDate(f.date_facture)}</span>
                        <span className="font-bold text-rose-700">{money(f.montant_restant)} restant</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ALERTS: echeances proches */}
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
                    Chèques &amp; traites
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Échéances proches</h2>
                </div>
                <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700">
                  {alertes.echeances_proches.length} à traiter
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {alertes.echeances_proches.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Aucune échéance proche.
                  </div>
                ) : (
                  alertes.echeances_proches.slice(0, 5).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">
                            {modeLabel(r.mode_paiement)} {r.reference_paiement ? `• ${r.reference_paiement}` : ""}
                          </div>
                          <div className="text-sm text-slate-600">
                            {r.locataire || "-"} • {r.facture || "-"}
                          </div>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700">
                          {r.jours_restants <= 0 ? "Échu" : `J-${r.jours_restants}`}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                        <span>Échéance: {shortDate(r.date_echeance)}</span>
                        <span className="font-bold text-amber-700">{money(r.montant_paye)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                    Registre central
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Règlements</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Cliquez pour ouvrir les détails ou utilisez les actions rapides.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {["Règlement", "Facture / Locataire", "Paiement", "Montant", "Statut", "Actions"].map((header) => (
                      <th key={header} className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                        Chargement des règlements...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12">
                        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                            <Banknote size={24} />
                          </div>
                          <div className="mt-4 text-lg font-bold text-slate-900">
                            Aucun règlement trouvé
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            Commencez par enregistrer un règlement pour une facture.
                          </p>
                          <button
                            type="button"
                            onClick={() => openCreateModal()}
                            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                          >
                            <Plus size={16} />
                            Ajouter un règlement
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const tone = statutTones[item.statut] || "slate";
                      const rowTone =
                        item.statut === "VALIDE"
                          ? "hover:bg-emerald-50/50"
                          : item.statut === "REJETE"
                          ? "bg-rose-50/40 hover:bg-rose-50/70"
                          : item.is_en_retard
                          ? "bg-rose-50/30 hover:bg-rose-50/60"
                          : "hover:bg-slate-50";

                      return (
                        <tr key={item.id} className={`group ${rowTone}`}>
                          <td className="px-4 py-4">
                            <button type="button" onClick={() => setDetailsItem(item)} className="text-left">
                              <div className="font-bold text-slate-900 transition group-hover:text-emerald-800">
                                {item.num_reglement}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {shortDate(item.date_reglement)}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-800">
                              {item.facture?.facture_code_full || item.facture?.facture_code || "-"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.locataire?.nom || "-"} • {item.station?.nom || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-800">{modeLabel(item.mode_paiement)}</div>
                            <div className="text-xs text-slate-500">
                              {item.reference_paiement || "—"}
                              {item.date_echeance ? ` • éch. ${shortDate(item.date_echeance)}` : ""}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-900">{money(item.montant_paye)}</div>
                            {Number(item.montant_restant) > 0 && (
                              <div className="text-xs font-semibold text-amber-600">
                                Reste {money(item.montant_restant)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-2">
                              <Badge tone={tone}>{statutLabels[item.statut] || item.statut}</Badge>
                              <Badge tone={item.statut_traitement === "TRAITE" ? "cyan" : "slate"}>
                                {item.statut_traitement === "TRAITE" ? "Traité" : "Non traité"}
                              </Badge>
                              {item.is_en_retard && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                  <AlertTriangle size={12} /> Échéance dépassée
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDetailsItem(item)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                              >
                                <Pencil size={14} />
                              </button>
                              {item.statut_traitement !== "TRAITE" && (
                                <button
                                  type="button"
                                  onClick={() => markTraite(item)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 px-3 py-2 font-semibold text-cyan-700 transition hover:bg-cyan-50"
                                  title="Marquer comme traité"
                                >
                                  <ShieldCheck size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 font-semibold text-rose-700 transition hover:bg-rose-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <ReglementFormModal
        form={form}
        formOpen={formOpen}
        factures={facturesForSelect}
        selectedFacture={selectedFacture}
        onlyUnpaid={onlyUnpaid}
        setOnlyUnpaid={setOnlyUnpaid}
        editingId={editingId}
        submitting={submitting}
        onClose={closeFormModal}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      <ReglementDetailsModal
        item={detailsItem}
        onClose={() => setDetailsItem(null)}
        onEdit={(item) => {
          setDetailsItem(null);
          startEdit(item);
        }}
        onDelete={(item) => {
          setDetailsItem(null);
          setDeleteTarget(item);
        }}
        onTraiter={(item) => {
          markTraite(item);
          setDetailsItem(null);
        }}
      />

      <ConfirmDeleteModal item={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteItem} />

      {/* BULLE DE NOTIFICATION */}
      {notifOpen && (
        <button
          type="button"
          aria-label="Fermer le menu de notifications"
          onClick={() => setNotifOpen(false)}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}

      <div className="fixed bottom-6 right-6 z-50">
        <Transition
          show={notifOpen}
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 translate-y-3 scale-95"
          enterTo="opacity-100 translate-y-0 scale-100"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0 scale-100"
          leaveTo="opacity-0 translate-y-3 scale-95"
        >
          <div className="absolute bottom-20 right-0 w-[21rem] rounded-[26px] border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between px-1">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
                  Consultation rapide
                </div>
                <div className="text-sm font-black text-slate-900">Choisir un statut de facture</div>
              </div>
              <button
                type="button"
                onClick={() => setNotifOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {statusCategories.map((cat) => {
                const tones = NOTIF_TONES[cat.tone];
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setStatusModal(cat);
                      setNotifOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition ${tones.choice}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tones.iconWrap}`}>
                        <Icon size={15} />
                      </span>
                      <span className="text-sm font-bold text-slate-800">{cat.label}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tones.badge}`}>
                      {cat.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Transition>

        <button
          type="button"
          onClick={() => setNotifOpen((open) => !open)}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl shadow-slate-900/30 transition hover:bg-emerald-700"
          aria-label="Ouvrir les notifications de règlements"
        >
          <BellRing size={26} />
          {notifBadgeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-black text-white ring-2 ring-white">
              {notifBadgeCount}
            </span>
          )}
        </button>
      </div>

      <FactureStatusModal
        category={statusModal}
        onClose={() => setStatusModal(null)}
        onCreateReglement={(factureId) => {
          setStatusModal(null);
          openCreateModal(factureId);
        }}
      />
    </div>
  );
}

function ReglementFormModal({
  form,
  formOpen,
  factures,
  selectedFacture,
  onlyUnpaid,
  setOnlyUnpaid,
  editingId,
  submitting,
  onClose,
  onChange,
  onSubmit,
}) {
  return (
    <Transition appear show={formOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#065f46_100%)] px-6 py-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-200">
                        Gestion des règlements
                      </div>
                      <Dialog.Title className="mt-2 text-2xl font-black">
                        {editingId ? "Modifier un règlement" : "Enregistrer un règlement"}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-300">
                        Sélectionnez la facture concernée puis renseignez le paiement reçu.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <form onSubmit={onSubmit} className="max-h-[78vh] overflow-y-auto px-6 py-6">
                  <div className="grid gap-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Facture
                        </span>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <input
                            type="checkbox"
                            checked={onlyUnpaid}
                            onChange={(e) => setOnlyUnpaid(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                          />
                          Impayées uniquement
                        </label>
                      </div>
                      <select
                        name="facture_id"
                        value={form.facture_id}
                        onChange={onChange}
                        className={`${fieldClassName} mt-1`}
                        required
                        disabled={Boolean(editingId)}
                      >
                        <option value="">Choisir une facture</option>
                        {factures.map((f) => (
                          <option key={f.id} value={f.id}>
                            {(f.facture_code_full || f.facture_code)} — {f.locataire?.nom} — Reste: {money(f.montant_restant)}
                          </option>
                        ))}
                      </select>
                      {selectedFacture && (
                        <div className="mt-3 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 text-xs">
                          <InfoMini label="Total facture" value={money(selectedFacture.total_ttc)} />
                          <InfoMini label="Déjà réglé" value={money(selectedFacture.montant_regle)} />
                          <InfoMini label="Reste à payer" value={money(selectedFacture.montant_restant)} strong />
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Mode de paiement
                      </span>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {modeOptions.map((m) => {
                          const Icon = m.icon;
                          const active = form.mode_paiement === m.value;
                          return (
                            <label
                              key={m.value}
                              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center text-xs font-semibold transition ${
                                active
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200"
                                  : "border-slate-200 text-slate-600 hover:border-emerald-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name="mode_paiement"
                                value={m.value}
                                checked={active}
                                onChange={onChange}
                                className="sr-only"
                              />
                              <Icon size={18} />
                              {m.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Montant réglé (TND)">
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          name="montant_paye"
                          value={form.montant_paye}
                          onChange={onChange}
                          className={fieldClassName}
                          required
                        />
                      </Field>
                      <Field label="Date du règlement">
                        <input
                          type="date"
                          name="date_reglement"
                          value={form.date_reglement}
                          onChange={onChange}
                          className={fieldClassName}
                          required
                        />
                      </Field>
                    </div>

                    {(needsReference(form.mode_paiement) || needsEcheance(form.mode_paiement)) && (
                      <div className="grid gap-4 md:grid-cols-3">
                        {needsReference(form.mode_paiement) && (
                          <Field label={form.mode_paiement === "CHEQUE" ? "N° chèque" : form.mode_paiement === "TRAITE" ? "N° traite" : "Référence virement"}>
                            <input
                              name="reference_paiement"
                              value={form.reference_paiement}
                              onChange={onChange}
                              className={fieldClassName}
                              required
                            />
                          </Field>
                        )}
                        <Field label="Banque">
                          <input name="banque" value={form.banque} onChange={onChange} className={fieldClassName} />
                        </Field>
                        {needsEcheance(form.mode_paiement) && (
                          <Field label="Date d'échéance">
                            <input
                              type="date"
                              name="date_echeance"
                              value={form.date_echeance}
                              onChange={onChange}
                              className={fieldClassName}
                            />
                          </Field>
                        )}
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="checkbox"
                          name="traite"
                          checked={form.traite}
                          onChange={onChange}
                          className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-400"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          Marquer comme traité (rapproché)
                        </span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <input
                          type="checkbox"
                          name="rejete"
                          checked={form.rejete}
                          onChange={onChange}
                          className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-400"
                        />
                        <span className="text-sm font-semibold text-rose-700">
                          Paiement rejeté (chèque / virement refusé)
                        </span>
                      </label>
                    </div>

                    <Field label="Observation">
                      <textarea
                        name="observation"
                        value={form.observation}
                        onChange={onChange}
                        rows="3"
                        className={`${fieldClassName} resize-none`}
                      />
                    </Field>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus size={16} />
                      {submitting ? "Enregistrement..." : editingId ? "Mettre à jour" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function ReglementDetailsModal({ item, onClose, onEdit, onDelete, onTraiter }) {
  return (
    <Transition appear show={Boolean(item)} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
                {item && (
                  <>
                    <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-200">
                            Fiche règlement
                          </div>
                          <Dialog.Title className="mt-2 text-2xl font-black">
                            {item.num_reglement}
                          </Dialog.Title>
                          <p className="mt-1 text-sm text-slate-300">
                            {item.facture?.facture_code_full || item.facture?.facture_code || "-"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-2xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="px-6 py-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <InfoCard label="Locataire" value={item.locataire?.nom || "-"} />
                        <InfoCard label="Station" value={item.station?.nom || "-"} />
                        <InfoCard label="Mode de paiement" value={modeLabel(item.mode_paiement)} />
                        <InfoCard label="Référence" value={item.reference_paiement || "Non renseignée"} />
                        <InfoCard label="Banque" value={item.banque || "Non renseignée"} />
                        <InfoCard label="Date règlement" value={shortDate(item.date_reglement)} />
                        <InfoCard label="Date échéance" value={shortDate(item.date_echeance)} />
                        <InfoCard label="Montant réglé" value={money(item.montant_paye)} />
                        <InfoCard label="Reste à payer" value={money(item.montant_restant)} />
                        <InfoCard
                          label="Traité par"
                          value={item.statut_traitement === "TRAITE" ? `${item.traite_par || "-"} • ${shortDate(item.traite_le)}` : "Non traité"}
                        />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Statut</div>
                          <div className="mt-2">
                            <Badge tone={statutTones[item.statut] || "slate"}>
                              {statutLabels[item.statut] || item.statut}
                            </Badge>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Traitement</div>
                          <div className="mt-2">
                            <Badge tone={item.statut_traitement === "TRAITE" ? "cyan" : "slate"}>
                              {item.statut_traitement === "TRAITE" ? "Traité" : "Non traité"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {item.observation && (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Observation
                          </div>
                          <div className="mt-2 text-sm leading-7 text-slate-700">{item.observation}</div>
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Supprimer
                        </button>
                        {item.statut_traitement !== "TRAITE" && (
                          <button
                            type="button"
                            onClick={() => onTraiter(item)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 px-4 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-50"
                          >
                            <ShieldCheck size={16} />
                            Marquer traité
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                          <Pencil size={16} />
                          Modifier
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function FactureStatusModal({ category, onClose, onCreateReglement }) {
  const tones = category ? NOTIF_TONES[category.tone] : NOTIF_TONES.slate;
  const Icon = category?.icon || Clock;

  return (
    <Transition appear show={Boolean(category)} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
                {category && (
                  <>
                    <div className={`border-b border-slate-200 px-6 py-5 text-white ${tones.header}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones.iconWrap}`}>
                            <Icon size={20} />
                          </span>
                          <div>
                            <Dialog.Title className="text-xl font-black">{category.label}</Dialog.Title>
                            <p className="mt-0.5 text-sm text-slate-300">
                              {category.items.length} facture(s)
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-2xl border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[65vh] overflow-y-auto px-6 py-6">
                      {category.items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                          Aucune facture dans cette catégorie pour le moment.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {category.items.map((f) => (
                            <div key={f.id} className={`rounded-2xl border px-4 py-4 ${tones.row}`}>
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="font-bold text-slate-900">
                                    {f.facture_code_full || f.facture_code}
                                  </div>
                                  <div className="mt-0.5 text-xs text-slate-500">
                                    {f.locataire?.nom || "-"} • {f.station?.nom || "-"} • {shortDate(f.date_facture)}
                                  </div>
                                </div>
                                {f.jours_retard != null && (
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tones.rowBadge}`}>
                                    {f.jours_retard} j. de retard
                                  </span>
                                )}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="text-slate-600">
                                  Total: <span className="font-bold text-slate-900">{money(f.total_ttc)}</span>
                                </span>
                                {Number(f.montant_restant) > 0 ? (
                                  <span className={`font-bold ${tones.accent}`}>
                                    Reste à payer: {money(f.montant_restant)}
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-700">Soldée</span>
                                )}
                              </div>

                              {Number(f.montant_restant) > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onCreateReglement(f.id)}
                                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                                >
                                  Enregistrer un règlement
                                  <ArrowRight size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function ConfirmDeleteModal({ item, onClose, onConfirm }) {
  return (
    <Transition appear show={Boolean(item)} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
                <div className="px-6 py-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                    <Trash2 size={22} />
                  </div>
                  <Dialog.Title className="mt-4 text-center text-2xl font-black text-slate-900">
                    Supprimer ce règlement ?
                  </Dialog.Title>
                  <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                    {item ? `Vous allez supprimer le règlement ${item.num_reglement}. Le statut de la facture sera recalculé.` : ""}
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={onConfirm}
                      className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function FilterSelect({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <select {...props} className={`${fieldClassName} mt-1`}>
        {children}
      </select>
    </label>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    emerald: "from-emerald-500/15 to-teal-500/10",
    amber: "from-amber-500/15 to-orange-500/10",
    blue: "from-blue-500/15 to-indigo-500/10",
    rose: "from-rose-500/15 to-pink-500/10",
  };

  return (
    <div className={`rounded-[26px] border border-slate-200 bg-gradient-to-br ${tones[tone]} p-5 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{label}</div>
          <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
        </div>
        <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    cyan: "bg-cyan-50 text-cyan-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

function InfoMini({ label, value, strong }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 ${strong ? "font-black text-emerald-700" : "font-semibold text-slate-700"}`}>
        {value}
      </div>
    </div>
  );
}
