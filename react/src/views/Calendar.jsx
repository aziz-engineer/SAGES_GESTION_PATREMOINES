import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaTimes,
  FaSave,
  FaSearch,
  FaSpinner,
  FaFileContract,
  FaUserTie,
  FaBuilding,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaPercent,
  FaChartLine,
  FaShieldAlt,
  FaChevronDown,
  FaCheck,

  // ✅ Alertes
  FaBell,
  FaExclamationTriangle,
  FaBolt,
  FaLayerGroup,
  FaSyncAlt,
  FaFilter,
  FaRegClock,
  FaChevronRight,
} from "react-icons/fa";

// ✅ Branding (AGIL)
import AgilLogo from "../assets/Agil_Logo.gif";
import { API_BASE_URL } from "../apiConfig";

// ─────────────────────────────
// API
// ─────────────────────────────
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ─────────────────────────────
// UI helpers
// ─────────────────────────────
const cn = (...c) => c.filter(Boolean).join(" ");
const isEmpty = (v) => v === null || v === undefined || v === "";
const labelOrDash = (v) => (isEmpty(v) ? "—" : v);

const formatMoney = (v) => {
  if (isEmpty(v)) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

const Pill = ({ tone = "gray", icon, children }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border",
        tones[tone]
      )}
    >
      {icon}
      {children}
    </span>
  );
};

const SkeletonRow = () => (
  <div className="animate-pulse grid grid-cols-7 gap-3 items-center py-3 px-4 border-b">
    <div className="h-3 rounded bg-gray-200 col-span-1" />
    <div className="h-3 rounded bg-gray-200 col-span-1" />
    <div className="h-3 rounded bg-gray-200 col-span-1" />
    <div className="h-3 rounded bg-gray-200 col-span-1" />
    <div className="h-3 rounded bg-gray-200 col-span-1" />
    <div className="h-3 rounded bg-gray-200 col-span-1 justify-self-end w-20" />
    <div className="h-8 rounded bg-gray-200 col-span-1 justify-self-end w-24" />
  </div>
);

/**
 * ✅ Professional Combobox (searchable dropdown)
 * - No external libs
 * - Click outside to close
 * - Search input inside dropdown
 */
const ComboBox = ({
  label,
  icon,
  help,
  value,
  onChangeValue,
  placeholder = "Rechercher...",
  options = [],
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => {
      const label = (o.label || "").toLowerCase();
      const sub = (o.sub || "").toLowerCase();
      return label.includes(s) || sub.includes(s);
    });
  }, [q, options]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <span className="text-gray-500">{icon}</span>
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm outline-none transition",
          "flex items-center justify-between gap-3",
          "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50",
          open ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200"
        )}
      >
        <div className="min-w-0 text-left">
          <div
            className={cn(
              "font-semibold truncate",
              selected ? "text-gray-900" : "text-gray-400"
            )}
          >
            {selected ? selected.label : "— Sélectionner —"}
          </div>
          {selected?.sub ? (
            <div className="text-xs text-gray-500 truncate">{selected.sub}</div>
          ) : null}
        </div>

        <FaChevronDown
          className={cn("text-gray-400 transition", open && "rotate-180")}
        />
      </button>

      {help && <p className="mt-1 text-xs text-gray-500">{help}</p>}

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="p-3 border-b bg-gray-50">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none
              focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                Aucun résultat
              </div>
            ) : (
              filtered.map((o) => {
                const isSel = String(o.value) === String(value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChangeValue(String(o.value));
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left flex items-start justify-between gap-3",
                      "transition hover:bg-indigo-50",
                      isSel && "bg-indigo-50"
                    )}
                  >
                    <div className="min-w-0">
                      <div
                        className={cn(
                          "text-sm font-semibold truncate",
                          isSel ? "text-indigo-900" : "text-gray-900"
                        )}
                      >
                        {o.label}
                      </div>
                      {o.sub ? (
                        <div className="text-xs text-gray-500 truncate">
                          {o.sub}
                        </div>
                      ) : null}
                    </div>
                    {isSel ? (
                      <FaCheck className="text-indigo-600 mt-0.5" />
                    ) : (
                      <span className="w-4" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 border-t bg-white flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────
// Alerts UI helpers
// ─────────────────────────────
const sevMeta = (severity) => {
  if (severity === "critical")
    return {
      label: "Critique",
      pillTone: "rose",
      icon: <FaBolt />,
      ring: "ring-rose-100",
      border: "border-rose-200",
      bg: "bg-rose-50/60",
      dot: "bg-rose-500",
    };
  if (severity === "high")
    return {
      label: "Élevée",
      pillTone: "amber",
      icon: <FaExclamationTriangle />,
      ring: "ring-amber-100",
      border: "border-amber-200",
      bg: "bg-amber-50/60",
      dot: "bg-amber-500",
    };
  return {
    label: "À surveiller",
    pillTone: "amber",
    icon: <FaBell />,
    ring: "ring-amber-100",
    border: "border-gray-200",
    bg: "bg-gray-50",
    dot: "bg-gray-400",
  };
};

const formatDays = (days) => {
  const d = Number(days || 0);
  if (!Number.isFinite(d)) return "—";
  if (d <= 1) return "1 jour";
  return `${d} jours`;
};

// ─────────────────────────────
// COMPONENT
// ─────────────────────────────
const Contrat = () => {
  const [contrats, setContrats] = useState([]);
  const [locataires, setLocataires] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ✅ UX: animation + lock scroll + ESC
  const [modalAnim, setModalAnim] = useState(false);

  // ✅ UI only: search + pagination
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // ✅ Alertes (nouveau design)
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState("");
  const [alerts, setAlerts] = useState([]);
  const thresholdMonths = 6;

  const [alertTab, setAlertTab] = useState("all"); // all | critical | high | warning
  const [alertSearch, setAlertSearch] = useState("");
  const [alertsCollapsed, setAlertsCollapsed] = useState(false);
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  const emptyForm = {
    locataire_id: "",
    station_id: "",
    date_debut: "",
    duree: "",
    date_fin: "",
    objet: "",
    loyer_fix_ht: "",
    augmentation_annuelle: "",
    loyer_variable: "",
    minimum_garantie: "",
  };

  const [form, setForm] = useState(emptyForm);

  // ─────────────────────────────
  // FETCH
  // ─────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, l, s] = await Promise.all([
        API.get("/contrats"),
        API.get("/locataires"),
        API.get("/stations"),
      ]);
      setContrats(c.data);
      setLocataires(l.data);
      setStations(s.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    setAlertsError("");
    try {
      const res = await API.get("/contrats/alerts", {
        params: { threshold_months: thresholdMonths },
      });
      setAlerts(res.data?.items || []);
    } catch (e) {
      console.error(e);
      setAlertsError("Erreur chargement des alertes (contrats).");
      setAlerts([]);
    }
    setAlertsLoading(false);
  };

  useEffect(() => {
    fetchAll();
    fetchAlerts();
  }, []);

  // ─────────────────────────────
  // ALERTS COMPUTED
  // ─────────────────────────────
  const alertById = useMemo(() => {
    const m = new Map();
    (alerts || []).forEach((a) => m.set(String(a.id), a));
    return m;
  }, [alerts]);

  const alertsIdSet = useMemo(() => new Set((alerts || []).map((a) => String(a.id))), [alerts]);

  const alertsCounts = useMemo(() => {
    const c = { all: alerts.length, critical: 0, high: 0, warning: 0 };
    alerts.forEach((a) => {
      if (a.severity === "critical") c.critical += 1;
      else if (a.severity === "high") c.high += 1;
      else c.warning += 1;
    });
    return c;
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    const s = (alertSearch || "").trim().toLowerCase();
    const byTab = (a) => {
      if (alertTab === "all") return true;
      if (alertTab === "critical") return a.severity === "critical";
      if (alertTab === "high") return a.severity === "high";
      if (alertTab === "warning") return a.severity !== "critical" && a.severity !== "high";
      return true;
    };

    return (alerts || [])
      .filter(byTab)
      .filter((a) => {
        if (!s) return true;
        const loc = (a.locataire?.nom || "").toLowerCase();
        const sta = (a.station?.nom || "").toLowerCase();
        const obj = (a.objet || "").toLowerCase();
        const fin = String(a.date_fin || "").toLowerCase();
        return loc.includes(s) || sta.includes(s) || obj.includes(s) || fin.includes(s);
      });
  }, [alerts, alertTab, alertSearch]);

  // ─────────────────────────────
  // SEARCH + PAGINATION (design only)
  // ─────────────────────────────
  const filteredContrats = useMemo(() => {
    const query = (q || "").toLowerCase().trim();
    let base = contrats;

    // ✅ option: afficher seulement contrats en alerte
    if (showOnlyAlerts) base = base.filter((c) => alertsIdSet.has(String(c.id)));

    if (!query) return base;

    return base.filter((c) => {
      const loc = (c?.locataire?.nom || "").toLowerCase();
      const sta = (c?.station?.nom || "").toLowerCase();
      const obj = (c?.objet || "").toLowerCase();
      const dd = String(c?.date_debut || "").toLowerCase();
      return (
        loc.includes(query) ||
        sta.includes(query) ||
        obj.includes(query) ||
        dd.includes(query)
      );
    });
  }, [contrats, q, showOnlyAlerts, alertsIdSet]);

  const totalPages = Math.max(1, Math.ceil(filteredContrats.length / perPage));

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredContrats.slice(start, start + perPage);
  }, [filteredContrats, page]);

  useEffect(() => setPage(1), [q, showOnlyAlerts]);

  // ─────────────────────────────
  // FORM
  // ─────────────────────────────
  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setOpen(true);
  };

  const openEdit = (c) => {
    setForm({
      locataire_id: c.locataire_id,
      station_id: c.station_id,
      date_debut: c.date_debut,
      duree: c.duree,
      date_fin: c.date_fin || "",
      objet: c.objet || "",
      loyer_fix_ht: c.loyer_fix_ht || "",
      augmentation_annuelle: c.augmentation_annuelle || "",
      loyer_variable: c.loyer_variable || "",
      minimum_garantie: c.minimum_garantie || "",
    });
    setEditingId(c.id);
    setOpen(true);
  };

  const closeModal = () => {
    setModalAnim(false);
    setTimeout(() => setOpen(false), 160);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ─────────────────────────────
  // SAVE (fonction inchangée)
  // ─────────────────────────────
  const save = async () => {
    try {
      if (editingId) {
        await API.put(`/contrats/${editingId}`, form);
        toast.success("Contrat modifie avec succes.");
      } else {
        await API.post("/contrats", form);
        toast.success("Contrat cree avec succes.");
      }
      closeModal();
      await fetchAll();
      await fetchAlerts(); // refresh alertes
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Erreur lors de l'enregistrement du contrat."
      );
    }
  };

  // ─────────────────────────────
  // DELETE (fonction inchangée)
  // ─────────────────────────────
  const remove = async (id) => {
    if (!window.confirm("Supprimer ce contrat ?")) return;
    try {
      await API.delete(`/contrats/${id}`);
      toast.success("Contrat supprime avec succes.");
      await fetchAll();
      await fetchAlerts(); // refresh alertes
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Erreur lors de la suppression du contrat."
      );
    }
  };

  // ─────────────────────────────
  // MODAL: lock scroll + ESC + animation
  // ─────────────────────────────
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);

    setTimeout(() => setModalAnim(true), 10);

    return () => {
      document.body.style.overflow = prevOverflow || "";
      window.removeEventListener("keydown", onKeyDown);
      setModalAnim(false);
    };
  }, [open]);

  // KPI (design only)
  const kpis = useMemo(() => {
    const total = contrats.length;
    const withObj = contrats.filter((c) => !!c.objet).length;
    const avgFixe = (() => {
      const nums = contrats
        .map((c) => Number(c.loyer_fix_ht))
        .filter((n) => Number.isFinite(n));
      if (!nums.length) return null;
      const s = nums.reduce((a, b) => a + b, 0);
      return s / nums.length;
    })();

    return { total, withObj, avgFixe };
  }, [contrats]);

  // ✅ options for combobox
  const locataireOptions = useMemo(
    () =>
      (locataires || []).map((l) => ({
        value: l.id,
        label: l.nom,
        sub: l.num ? `N° ${l.num}` : `ID ${l.id}`,
      })),
    [locataires]
  );

  const stationOptions = useMemo(
    () =>
      (stations || []).map((s) => ({
        value: s.id,
        label: s.nom,
        sub: s.numero ? `N° ${s.numero}` : `ID ${s.id}`,
      })),
    [stations]
  );

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO / BRAND */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-25">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-rose-500 blur-3xl" />
        </div>

        <div className="relative border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-sm">
                <img src={AgilLogo} alt="AGIL" className="w-full h-full object-contain" />
              </div>
              <div className="text-white">
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  SAGES • Société de Gestion &amp; Service
                </div>
                <h1 className="mt-1 text-2xl md:text-3xl font-extrabold">
                  Gestion des Contrats
                </h1>
                <p className="mt-2 text-sm text-white/70 max-w-2xl leading-relaxed">
                  Création, modification et suivi des contrats (locataire ↔ station).
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill tone="indigo" icon={<FaFileContract />}>
                    {loading ? "…" : kpis.total} contrats
                  </Pill>
                  <Pill tone="green" icon={<FaShieldAlt />}>
                    Statut: interne
                  </Pill>
                  <Pill tone="amber" icon={<FaChartLine />}>
                    Moy. loyer: {kpis.avgFixe === null ? "—" : formatMoney(kpis.avgFixe)} DT
                  </Pill>
                  <Pill tone={(alertsCounts.all || 0) > 0 ? "amber" : "gray"} icon={<FaBell />}>
                    {alertsLoading ? "…" : alertsCounts.all} alerte(s)
                  </Pill>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[360px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-white">
              <div className="text-sm font-extrabold">Alertes</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">
                Alerte si contrat expire dans <strong>{thresholdMonths} mois</strong>.
                <br />
                Vue pro “Notification Center” pour présenter au manager.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* ✅ NEW DESIGN: NOTIFICATION CENTER (ultra pro) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b bg-gradient-to-b from-white to-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
                <FaBell />
              </div>
              <div>
                <div className="text-sm font-extrabold text-gray-900">
                  Notification Center — Contrats à échéance
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Suivi des contrats dont la date de fin est proche (≤ {thresholdMonths} mois).
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAlertsCollapsed((v) => !v)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-semibold border inline-flex items-center gap-2",
                  "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                <FaLayerGroup />
                {alertsCollapsed ? "Afficher" : "Réduire"}
              </button>

              <button
                onClick={fetchAlerts}
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 inline-flex items-center gap-2"
              >
                {alertsLoading ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
                Rafraîchir
              </button>

              <button
                onClick={() => setShowOnlyAlerts((v) => !v)}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-semibold border inline-flex items-center gap-2",
                  showOnlyAlerts
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
                title="Filtrer la table sur les contrats en alerte"
              >
                <FaFilter className={showOnlyAlerts ? "text-amber-700" : "text-gray-400"} />
                {showOnlyAlerts ? "Table: tout" : "Table: alertes"}
              </button>
            </div>
          </div>

          {/* Body */}
          {!alertsCollapsed && (
            <div className="p-5">
              {/* KPI strip */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Total alertes</div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {alertsLoading ? "…" : alertsCounts.all}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                    <FaRegClock /> Seuil: {thresholdMonths} mois
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="text-xs text-rose-800 uppercase font-semibold flex items-center gap-2">
                    <FaBolt /> Critiques
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-rose-900">
                    {alertsLoading ? "…" : alertsCounts.critical}
                  </div>
                  <div className="mt-2 text-xs text-rose-800/80">
                    Fin très proche (ex: ≤ 30 jours)
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                  <div className="text-xs text-amber-900 uppercase font-semibold flex items-center gap-2">
                    <FaExclamationTriangle /> Élevées
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-amber-950">
                    {alertsLoading ? "…" : alertsCounts.high}
                  </div>
                  <div className="mt-2 text-xs text-amber-900/80">
                    À traiter prochainement (ex: ≤ 90 jours)
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs text-gray-700 uppercase font-semibold flex items-center gap-2">
                    <FaBell /> À surveiller
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {alertsLoading ? "…" : alertsCounts.warning}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Planification / préparation
                  </div>
                </div>
              </div>

              {/* Tabs + search */}
              <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "Toutes", count: alertsCounts.all },
                    { key: "critical", label: "Critiques", count: alertsCounts.critical },
                    { key: "high", label: "Élevées", count: alertsCounts.high },
                    { key: "warning", label: "À surveiller", count: alertsCounts.warning },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setAlertTab(t.key)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-semibold border inline-flex items-center gap-2",
                        alertTab === t.key
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {t.label}
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          alertTab === t.key
                            ? "bg-white/15 border-white/20"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="w-full md:w-[360px]">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={alertSearch}
                      onChange={(e) => setAlertSearch(e.target.value)}
                      placeholder="Rechercher dans les alertes (locataire, station, objet, date fin)..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none
                      focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {/* Alerts list (inbox style) */}
              <div className="mt-4 rounded-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 flex items-center justify-between">
                  <span>Alertes</span>
                  <span className="text-gray-500">
                    {alertsLoading ? "…" : `${filteredAlerts.length} élément(s)`}
                  </span>
                </div>

                {alertsError ? (
                  <div className="p-4">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 flex items-start gap-3">
                      <FaExclamationTriangle className="mt-0.5" />
                      <div className="text-sm">{alertsError}</div>
                    </div>
                  </div>
                ) : alertsLoading ? (
                  <div className="p-4 text-gray-500 inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Chargement des alertes…
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <div className="text-base font-extrabold text-gray-900">
                      Aucune alerte à afficher
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Change l’onglet ou efface la recherche.
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAlerts.slice(0, 10).map((a) => {
                      const meta = sevMeta(a.severity);
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            "p-4 bg-white hover:bg-gray-50 transition",
                            "flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                          )}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={cn("w-3 h-3 rounded-full mt-1.5", meta.dot)} />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-extrabold text-gray-900 truncate">
                                  {a.locataire?.nom || "—"} • {a.station?.nom || "—"}
                                </div>
                                <Pill tone={meta.pillTone} icon={meta.icon}>
                                  {meta.label}
                                </Pill>
                                <Pill tone="gray" icon={<FaRegClock />}>
                                  {formatDays(a.days_left)}
                                </Pill>
                              </div>

                              <div className="mt-1 text-sm text-gray-600 truncate">
                                Objet: {a.objet || "—"} • Fin:{" "}
                                <span className="font-semibold text-gray-900">{a.date_fin}</span>
                              </div>

                              <div className="mt-2 text-xs text-gray-500">
                                Contrat #{a.id} • Locataire ID {a.locataire_id} • Station ID {a.station_id}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            

                            <button
                              onClick={() => {
                                // Ouvrir la modal édition directement (si contrat existe)
                                const c = contrats.find((x) => String(x.id) === String(a.id));
                                if (c) openEdit(c);
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold"
                            >
                              <FaEdit /> Modifier
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer note */}
              <div className="mt-3 text-xs text-gray-500">
                Astuce: clique sur <strong>Ouvrir</strong> pour filtrer automatiquement la table.
              </div>
            </div>
          )}
        </div>

        {/* TOP ACTION BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">
                  Table des contrats
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {loading ? "Chargement…" : `${filteredContrats.length} résultat(s)`} • Page {page}/{totalPages}
                </div>
              </div>

              <div className="w-full md:w-[340px]">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Rechercher un contrat…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 font-semibold shadow-sm"
                onClick={openCreate}
              >
                <FaPlus />
                Nouveau contrat
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 w-full md:w-[280px]">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Indicateurs
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Avec objet</div>
                <div className="text-lg font-extrabold text-gray-900">
                  {loading ? "…" : kpis.withObj}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Sans objet</div>
                <div className="text-lg font-extrabold text-gray-900">
                  {loading ? "…" : Math.max(0, kpis.total - kpis.withObj)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
              <FaFileContract className="text-indigo-600" />
              Liste
            </div>

            <div className="text-xs text-gray-500">
              ✎ Modifier • 🗑️ Supprimer • ⚠️ Badge = expiration proche
            </div>
          </div>

          {loading ? (
            <div>
              <div className="px-5 py-4 flex items-center gap-2 text-gray-500 text-sm">
                <FaSpinner className="animate-spin" />
                Chargement des contrats…
              </div>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : filteredContrats.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">📄</div>
              <div className="mt-3 text-base font-extrabold text-gray-900">
                Aucun contrat
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Créez un contrat en cliquant sur <strong>Nouveau contrat</strong>.
              </div>
              <button
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 font-semibold shadow-sm"
                onClick={openCreate}
              >
                <FaPlus /> Créer un contrat
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Locataire
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Station
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Objet
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Date début
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Durée
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Loyer HT
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((c) => {
                      const a = alertById.get(String(c.id));
                      const isAlert = !!a;
                      const meta = a ? sevMeta(a.severity) : null;

                      return (
                        <tr
                          key={c.id}
                          className={cn(
                            "border-b transition",
                            isAlert ? "hover:bg-amber-50/40 bg-amber-50/20" : "hover:bg-indigo-50/60"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 flex items-center justify-center">
                                <FaUserTie />
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-gray-900 truncate">
                                  {labelOrDash(c.locataire?.nom)}
                                </div>
                                <div className="text-xs text-gray-500">ID: {c.locataire_id}</div>

                                {isAlert && (
                                  <div className="mt-1 flex flex-wrap gap-2 items-center">
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                                        meta?.border || "border-gray-200",
                                        meta?.bg || "bg-gray-50",
                                        meta?.ring
                                      )}
                                    >
                                      {meta?.icon}
                                      {meta?.label} • {formatDays(a.days_left)}
                                    </span>

                                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-gray-200 bg-white text-gray-700">
                                      Fin: {a.date_fin}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                <FaBuilding />
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-gray-900 truncate">
                                  {labelOrDash(c.station?.nom)}
                                </div>
                                <div className="text-xs text-gray-500">ID: {c.station_id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs font-semibold">
                              {labelOrDash(c.objet)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-2 text-gray-700 font-semibold">
                              <FaCalendarAlt className="text-gray-400" />
                              {labelOrDash(c.date_debut)}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-800 text-xs font-semibold">
                              {labelOrDash(c.duree)} mois
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center gap-2 justify-end font-extrabold text-gray-900">
                              <FaMoneyBillWave className="text-gray-400" />
                              {c.loyer_fix_ht ? formatMoney(c.loyer_fix_ht) : "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-indigo-700 mr-2 transition"
                              onClick={() => openEdit(c)}
                              title="Modifier"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                              onClick={() => remove(c.id)}
                              title="Supprimer"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-5 py-4 border-t bg-white flex items-center justify-between text-xs text-gray-500">
                <div>
                  Page <span className="font-semibold text-gray-900">{page}</span> /{" "}
                  <span className="font-semibold text-gray-900">{totalPages}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-semibold transition",
                      page === 1
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                    )}
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-semibold transition",
                      page === totalPages
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                    )}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ───────── MODAL ───────── */}
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-[9999] bg-black/60 px-4 py-6 flex items-center justify-center transition-opacity duration-150",
            modalAnim ? "opacity-100" : "opacity-0"
          )}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={cn(
              "w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-transform duration-150",
              modalAnim ? "scale-100 translate-y-0" : "scale-[0.98] translate-y-2"
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <img src={AgilLogo} alt="AGIL" className="w-5 h-5 object-contain" />
                  AGIL • Contrats
                </div>
                <h2 className="mt-1 text-lg md:text-xl font-extrabold text-gray-900">
                  {editingId ? "Modifier le contrat" : "Nouveau contrat"}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill tone="indigo" icon={<FaFileContract />}>Contrat</Pill>
                  <Pill tone="gray" icon={<FaShieldAlt />}>Fermer: ESC</Pill>
                </div>
              </div>

              <button
                className="w-10 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 transition inline-flex items-center justify-center"
                onClick={closeModal}
                title="Fermer (ESC)"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body scroll */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Locataire (ComboBox) */}
                <ComboBox
                  label="Locataire"
                  icon={<FaUserTie className="text-indigo-600" />}
                  value={form.locataire_id}
                  onChangeValue={(v) => setForm((f) => ({ ...f, locataire_id: v }))}
                  options={locataireOptions}
                  placeholder="Rechercher un locataire..."
                  help="Tapez pour filtrer (nom / numéro)."
                />

                {/* Station (ComboBox) */}
                <ComboBox
                  label="Station"
                  icon={<FaBuilding className="text-emerald-600" />}
                  value={form.station_id}
                  onChangeValue={(v) => setForm((f) => ({ ...f, station_id: v }))}
                  options={stationOptions}
                  placeholder="Rechercher une station..."
                  help="Tapez pour filtrer (nom / numéro)."
                />

                {/* Date début */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-500" /> Date début
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    type="date"
                    name="date_debut"
                    value={form.date_debut}
                    onChange={onChange}
                  />
                </div>

                {/* Durée */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-500" /> Durée (mois)
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    type="number"
                    name="duree"
                    placeholder="Durée (mois)"
                    value={form.duree}
                    onChange={onChange}
                  />
                </div>

                {/* Date fin */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-500" /> Date fin
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    type="date"
                    name="date_fin"
                    value={form.date_fin}
                    onChange={onChange}
                  />
                </div>

                {/* Objet */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaFileContract className="text-indigo-600" /> Objet
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    name="objet"
                    placeholder="Objet (café, resto…)"
                    value={form.objet}
                    onChange={onChange}
                  />
                </div>

                {/* Loyer fixe */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaMoneyBillWave className="text-gray-500" /> Loyer fixe HT / mois
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    name="loyer_fix_ht"
                    placeholder="Loyer fixe HT / mois"
                    value={form.loyer_fix_ht}
                    onChange={onChange}
                  />
                </div>

                {/* Augmentation */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaPercent className="text-gray-500" /> Augmentation annuelle (%)
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    name="augmentation_annuelle"
                    placeholder="Augmentation annuelle (%)"
                    value={form.augmentation_annuelle}
                    onChange={onChange}
                  />
                </div>

                {/* Variable */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaChartLine className="text-gray-500" /> Loyer variable
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    name="loyer_variable"
                    placeholder="Loyer variable"
                    value={form.loyer_variable}
                    onChange={onChange}
                  />
                </div>

                {/* Minimum garanti */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaShieldAlt className="text-gray-500" /> Minimum garanti
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    name="minimum_garantie"
                    placeholder="Minimum garanti"
                    value={form.minimum_garantie}
                    onChange={onChange}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 leading-relaxed">
                <strong>Note:</strong> Les fonctionnalités CRUD sont inchangées. Ajout: centre d’alertes.
              </div>
            </div>

            {/* Sticky footer actions */}
            <div className="sticky bottom-0 bg-white border-t px-5 py-4 flex items-center justify-end gap-2">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 font-semibold"
                onClick={closeModal}
              >
                <FaTimes /> Annuler
              </button>

              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                onClick={save}
              >
                <FaSave /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contrat;
