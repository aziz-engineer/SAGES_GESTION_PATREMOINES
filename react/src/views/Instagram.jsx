import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import axiosClient from "../axios";
import {
  FaUsers,
  FaMapMarkerAlt,
  FaFileContract,
  FaFileInvoiceDollar,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaBuilding,
  FaShieldAlt,
  FaArrowRight,
  FaChartLine,
  FaBell,
  FaClock,
  FaCircle,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaSyncAlt,
  FaHashtag,
  FaChevronDown,
  FaCheck,
} from "react-icons/fa";

import AgilLogo from "../assets/Agil_Logo.gif";

// -----------------------------
// Helpers
// -----------------------------
const cn = (...c) => c.filter(Boolean).join(" ");
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmt3 = (v) => toNum(v).toFixed(3);

const normalizeList = (resData) => {
  if (Array.isArray(resData)) return { items: resData, total: resData.length };
  if (resData && Array.isArray(resData.data))
    return { items: resData.data, total: resData.total ?? resData.data.length };
  return { items: [], total: 0 };
};

const parseISODate = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const monthKeyFromFacture = (f) => {
  if (f?.mois && f?.annee) return `${String(f.annee)}-${String(f.mois).padStart(2, "0")}`;
  const d = parseISODate(f?.date_facture) || parseISODate(f?.created_at);
  if (!d) return "—";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// ✅ Fetch all pages (Laravel pagination) and concat
async function fetchAllPages(getPageFn, { pageStart = 1, maxPages = 500, delayMs = 0 } = {}) {
  let page = pageStart;
  let all = [];
  let guard = 0;

  while (guard < maxPages) {
    guard++;
    const res = await getPageFn(page);
    const data = res?.data;

    if (data && Array.isArray(data.data)) {
      all = all.concat(data.data);

      const current = data.current_page ?? page;
      const last = data.last_page;
      const nextUrl = data.next_page_url;

      if (last && current >= last) break;
      if (!last && !nextUrl) break;

      page++;
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }

    if (Array.isArray(data)) {
      all = all.concat(data);
    }
    break;
  }

  return all;
}

// -----------------------------
// UI Components
// -----------------------------
const Pill = ({ tone = "gray", children }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-green-50 text-green-700 border-green-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border font-semibold", tones[tone])}>
      {children}
    </span>
  );
};

const KPI = ({ label, value, icon, tone = "indigo", hint }) => {
  const tones = {
    indigo: "from-indigo-50 to-white border-indigo-200",
    green: "from-green-50 to-white border-green-200",
    rose: "from-rose-50 to-white border-rose-200",
    amber: "from-amber-50 to-white border-amber-200",
    slate: "from-slate-50 to-white border-slate-200",
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      <div className={cn("p-5 bg-gradient-to-b", tones[tone])}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
            <div className="mt-1 text-3xl font-extrabold text-gray-900">{value}</div>
            {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/80 border flex items-center justify-center shadow-sm text-gray-800">
            <span className="text-lg">{icon}</span>
          </div>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-1 w-2/3 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};

const TileLink = ({ to, title, desc, icon, accent = "indigo", badge }) => {
  const accents = {
    indigo: "group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700",
    green: "group-hover:border-green-200 group-hover:bg-green-50 group-hover:text-green-700",
    rose: "group-hover:border-rose-200 group-hover:bg-rose-50 group-hover:text-rose-700",
    amber: "group-hover:border-amber-200 group-hover:bg-amber-50 group-hover:text-amber-800",
  };
  return (
    <NavLink to={to} className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="p-5 flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 transition", accents[accent])}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="font-extrabold text-gray-900">{title}</div>
            {badge && <span className="text-[11px] px-2 py-1 rounded-full border bg-gray-50 text-gray-600">{badge}</span>}
          </div>
          <div className="mt-1 text-sm text-gray-500 leading-relaxed">{desc}</div>
        </div>
        <div className="text-gray-300 group-hover:text-gray-500 transition mt-1">
          <FaArrowRight />
        </div>
      </div>
    </NavLink>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-xs text-gray-500 uppercase font-semibold">{label}</div>
      <div className="text-sm font-semibold text-gray-900 break-words">{value}</div>
    </div>
  </div>
);

const MiniBarChart = ({ values = [] }) => {
  const max = Math.max(...values.map(toNum), 0) || 1;
  return (
    <div className="mt-3">
      <div className="flex items-end gap-2 h-24">
        {values.map((v, idx) => {
          const h = Math.round((toNum(v) / max) * 100);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-xl bg-gray-100 border overflow-hidden h-24 flex items-end">
                <div className="w-full bg-indigo-500/70" style={{ height: `${h}%` }} title={`${fmt3(v)} DT`} />
              </div>
              <div className="text-[10px] text-gray-500">#{idx + 1}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500">Graph : Total TTC (dernières factures)</div>
    </div>
  );
};

/**
 * ✅ Professional Combobox (searchable dropdown)
 * Ajout: option "Tous" (All) visible dans la liste.
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
  includeAll = false,
  allLabel = "Tous",
  allSub = "Afficher tous",
  allValue = "",
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const mergedOptions = useMemo(() => {
    if (!includeAll) return options;
    // évite doublon si déjà présent
    const hasAll = options.some((o) => String(o.value) === String(allValue));
    const allOpt = { value: allValue, label: allLabel, sub: allSub };
    return hasAll ? options : [allOpt, ...options];
  }, [includeAll, options, allLabel, allSub, allValue]);

  const selected = useMemo(
    () => mergedOptions.find((o) => String(o.value) === String(value)),
    [mergedOptions, value]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return mergedOptions;
    return mergedOptions.filter((o) => {
      const lab = (o.label || "").toLowerCase();
      const sub = (o.sub || "").toLowerCase();
      return lab.includes(s) || sub.includes(s);
    });
  }, [q, mergedOptions]);

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
          <div className={cn("font-semibold truncate", selected ? "text-gray-900" : "text-gray-400")}>
            {selected ? selected.label : "— Sélectionner —"}
          </div>
          {selected?.sub ? <div className="text-xs text-gray-500 truncate">{selected.sub}</div> : null}
        </div>

        <FaChevronDown className={cn("text-gray-400 transition", open && "rotate-180")} />
      </button>

      {help && <p className="mt-1 text-xs text-gray-500">{help}</p>}

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="p-3 border-b bg-gray-50">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">Aucun résultat</div>
            ) : (
              filtered.map((o) => {
                const isSel = String(o.value) === String(value);
                return (
                  <button
                    key={`opt-${o.value}-${o.label}`}
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
                      <div className={cn("text-sm font-semibold truncate", isSel ? "text-indigo-900" : "text-gray-900")}>
                        {o.label}
                      </div>
                      {o.sub ? <div className="text-xs text-gray-500 truncate">{o.sub}</div> : null}
                    </div>
                    {isSel ? <FaCheck className="text-indigo-600 mt-0.5" /> : <span className="w-4" />}
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

const TextInput = ({ label, icon, value, onChange, placeholder, help }) => (
  <div>
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
      <span className="text-gray-500">{icon}</span>
      {label}
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition
      focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
    {help && <p className="mt-1 text-xs text-gray-500">{help}</p>}
  </div>
);

// -----------------------------
// Page
// -----------------------------
export default function Accueil() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState({
    locataires: 0,
    stations: 0,
    contrats: 0,
    factures: 0,
  });

  const [locataires, setLocataires] = useState([]);
  const [stations, setStations] = useState([]);

  const [facturesAll, setFacturesAll] = useState([]);
  const [lastFactures, setLastFactures] = useState([]);

  const [invoiceStats, setInvoiceStats] = useState({
    global: { count_factures: 0, sum_total_ttc: 0 },
    by_month: [],
    by_station: [],
    by_locataire: [],
  });

  // ✅ filtres (avec "Tous" via combobox)
  const [filters, setFilters] = useState({
    stationId: "", // "" => Tous
    locataireId: "", // "" => Tous
    monthKey: "", // "" => Tous
    year: "", // "" => Tous
    qCode: "",
  });

  const [qAggMonth, setQAggMonth] = useState("");
  const [qAggStation, setQAggStation] = useState("");
  const [qAggLoc, setQAggLoc] = useState("");

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      const [locRes, staRes, conRes] = await Promise.all([axiosClient.get("/locataires"), axiosClient.get("/stations"), axiosClient.get("/contrats")]);

      const loc = normalizeList(locRes.data);
      const sta = normalizeList(staRes.data);
      const con = normalizeList(conRes.data);

      setLocataires(loc.items || []);
      setStations(sta.items || []);

      const all = await fetchAllPages((page) => axiosClient.get("/factures", { params: { page } }));
      setFacturesAll(all);

      setStats({
        locataires: loc.total,
        stations: sta.total,
        contrats: con.total,
        factures: all.length,
      });

      const sorted = [...all].sort((a, b) => {
        const da = new Date(a.created_at || a.date_facture || 0).getTime();
        const db = new Date(b.created_at || b.date_facture || 0).getTime();
        return db - da;
      });
      setLastFactures(sorted.slice(0, 5));

      // /factures/stats optionnel
      try {
        const s = await axiosClient.get("/factures/stats");
        setInvoiceStats(
          s.data || { global: { count_factures: all.length, sum_total_ttc: 0 }, by_month: [], by_station: [], by_locataire: [] }
        );
      } catch {
        const sumAll = all.reduce((acc, f) => acc + toNum(f.total_ttc), 0);

        const gM = new Map();
        const gS = new Map();
        const gL = new Map();

        all.forEach((f) => {
          const mk = monthKeyFromFacture(f);
          gM.set(mk, (gM.get(mk) || 0) + toNum(f.total_ttc));

          const sid = String(f.station_id ?? f.station?.id ?? "");
          const sname = f.station?.nom || (sta.items || []).find((x) => String(x.id) === sid)?.nom || "—";
          if (sid) {
            const prev = gS.get(sid);
            gS.set(sid, { station_id: sid, station_nom: sname, sum_total_ttc: (prev?.sum_total_ttc || 0) + toNum(f.total_ttc) });
          }

          const lid = String(f.locataire_id ?? f.locataire?.id ?? "");
          const lname = f.locataire?.nom || (loc.items || []).find((x) => String(x.id) === lid)?.nom || "—";
          if (lid) {
            const prev = gL.get(lid);
            gL.set(lid, { locataire_id: lid, locataire_nom: lname, sum_total_ttc: (prev?.sum_total_ttc || 0) + toNum(f.total_ttc) });
          }
        });

        const by_month = Array.from(gM.entries())
          .map(([month, sum]) => ({ month, sum_total_ttc: sum }))
          .sort((a, b) => String(b.month).localeCompare(String(a.month)));

        const by_station = Array.from(gS.values()).sort((a, b) => toNum(b.sum_total_ttc) - toNum(a.sum_total_ttc));
        const by_locataire = Array.from(gL.values()).sort((a, b) => toNum(b.sum_total_ttc) - toNum(a.sum_total_ttc));

        setInvoiceStats({
          global: { count_factures: all.length, sum_total_ttc: sumAll },
          by_month,
          by_station,
          by_locataire,
        });
      }
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement tableau de bord (API).");
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toLocaleDateString("fr-FR");

  const chartValues = useMemo(() => {
    const values = [...lastFactures].slice(0, 6).map((f) => toNum(f.total_ttc));
    return values.reverse();
  }, [lastFactures]);

  // ✅ options avec "Tous"
  const stationOptions = useMemo(
    () =>
      (stations || []).map((s) => ({
        value: String(s.id),
        label: s.nom || `Station ${s.id}`,
        sub: s.numero ? `N° ${s.numero}` : `ID ${s.id}`,
      })),
    [stations]
  );

  const locataireOptions = useMemo(
    () =>
      (locataires || []).map((l) => ({
        value: String(l.id),
        label: l.nom || `Locataire ${l.id}`,
        sub: l.num ? `N° ${l.num}` : `ID ${l.id}`,
      })),
    [locataires]
  );

  const monthOptions = useMemo(() => {
    const set = new Set();
    facturesAll.forEach((f) => set.add(monthKeyFromFacture(f)));
    const arr = Array.from(set).filter((x) => x && x !== "—").sort((a, b) => String(b).localeCompare(String(a)));
    return arr.map((m) => ({ value: String(m), label: String(m), sub: "Mois de facturation" }));
  }, [facturesAll]);

  // Filtrage factures (front)
  const filteredFactures = useMemo(() => {
    let list = facturesAll || [];

    const sid = (filters.stationId || "").trim(); // "" => Tous
    const lid = (filters.locataireId || "").trim(); // "" => Tous
    const mk = (filters.monthKey || "").trim(); // "" => Tous
    const yr = (filters.year || "").trim(); // "" => Tous
    const q = (filters.qCode || "").trim().toLowerCase();

    if (sid) list = list.filter((f) => String(f.station_id ?? f.station?.id ?? "") === String(sid));
    if (lid) list = list.filter((f) => String(f.locataire_id ?? f.locataire?.id ?? "") === String(lid));
    if (mk) list = list.filter((f) => monthKeyFromFacture(f) === mk);
    else if (yr) list = list.filter((f) => String(monthKeyFromFacture(f)).startsWith(String(yr) + "-"));

    if (q) list = list.filter((f) => String(f.facture_code_full || f.facture_code || "").toLowerCase().includes(q));

    return [...list].sort((a, b) => {
      const da = new Date(a.created_at || a.date_facture || 0).getTime();
      const db = new Date(b.created_at || b.date_facture || 0).getTime();
      return db - da;
    });
  }, [facturesAll, filters]);

  const sumFiltered = useMemo(
    () => filteredFactures.reduce((acc, f) => acc + toNum(f.total_ttc), 0),
    [filteredFactures]
  );

  const sumAllTTC = useMemo(() => {
    const v = invoiceStats?.global?.sum_total_ttc;
    if (v !== undefined && v !== null) return toNum(v);
    return facturesAll.reduce((acc, f) => acc + toNum(f.total_ttc), 0);
  }, [invoiceStats, facturesAll]);

  const countAll = useMemo(() => {
    const v = invoiceStats?.global?.count_factures;
    if (v !== undefined && v !== null) return toNum(v);
    return facturesAll.length;
  }, [invoiceStats, facturesAll]);

  // Filtrage agrégats
  const aggMonth = useMemo(() => {
    const q = qAggMonth.trim().toLowerCase();
    const items = invoiceStats?.by_month || [];
    if (!q) return items;
    return items.filter((x) => String(x.month || x.mois || "").toLowerCase().includes(q));
  }, [invoiceStats, qAggMonth]);

  const aggStation = useMemo(() => {
    const q = qAggStation.trim().toLowerCase();
    const items = invoiceStats?.by_station || [];
    if (!q) return items;
    return items.filter((x) => String(x.station_nom || x.station || "").toLowerCase().includes(q));
  }, [invoiceStats, qAggStation]);

  const aggLoc = useMemo(() => {
    const q = qAggLoc.trim().toLowerCase();
    const items = invoiceStats?.by_locataire || [];
    if (!q) return items;
    return items.filter((x) => String(x.locataire_nom || x.locataire || "").toLowerCase().includes(q));
  }, [invoiceStats, qAggLoc]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-rose-500 blur-3xl" />
        </div>

        <div className="relative border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Brand */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-sm">
                  <img src={AgilLogo} alt="AGIL" className="w-full h-full object-contain" />
                </div>
                <div className="text-white">
                  <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    AGIL • Société de Gestion &amp; Service
                  </div>
                  <h1 className="mt-1 text-2xl md:text-3xl font-extrabold">
                    Tableau de bord — Gestion des locataires
                  </h1>
                  <p className="mt-2 text-sm text-white/70 max-w-2xl leading-relaxed">
                    Vue d’ensemble : entités, activité factures, totaux globaux et recherches (station / locataire / mois).
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill tone="indigo"><FaShieldAlt /> Accès sécurisé</Pill>
                    <Pill tone="gray"><FaClock /> {today}</Pill>
                    <Pill tone="green"><FaChartLine /> Statistiques</Pill>
                    <button
                      onClick={refresh}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border font-semibold bg-white/10 border-white/15 text-white hover:bg-white/15 transition"
                      title="Rafraîchir"
                    >
                      <FaSyncAlt /> Rafraîchir
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="w-full lg:w-[360px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 text-white">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <FaBell className="text-amber-300" />
                  Résumé Factures
                </div>
                <div className="mt-2 text-sm text-white/70 leading-relaxed">
                  • Total factures : <span className="font-bold text-white">{loading ? "…" : countAll}</span>
                  <br />
                  • Somme TTC : <span className="font-bold text-white">{loading ? "…" : `${fmt3(sumAllTTC)} DT`}</span>
                  <br />
                  • Filtre actif :{" "}
                  <span className="font-bold text-white">
                    {filters.stationId || filters.locataireId || filters.monthKey || filters.year || filters.qCode ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="mt-3 text-xs text-white/50">
                  (Le chargement concatène toutes les pages de /api/factures.)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Error */}
        {err && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 px-5 py-4 flex items-start gap-3">
            <FaExclamationTriangle className="mt-0.5" />
            <div className="text-sm">{err}</div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <KPI
            label="Locataires"
            value={loading ? "…" : stats.locataires}
            hint="Total enregistrés"
            icon={<FaUsers className="text-indigo-700" />}
            tone="indigo"
          />
          <KPI
            label="Stations"
            value={loading ? "…" : stats.stations}
            hint="Stations actives"
            icon={<FaMapMarkerAlt className="text-green-700" />}
            tone="green"
          />
          <KPI
            label="Contrats"
            value={loading ? "…" : stats.contrats}
            hint="Contrats en cours"
            icon={<FaFileContract className="text-amber-800" />}
            tone="amber"
          />
          <KPI
            label="Factures"
            value={loading ? "…" : stats.factures}
            hint="Toutes pages concaténées"
            icon={<FaFileInvoiceDollar className="text-rose-700" />}
            tone="rose"
          />
          <KPI
            label="Somme TTC"
            value={loading ? "…" : `${fmt3(sumAllTTC)} DT`}
            hint="Global"
            icon={<FaHashtag className="text-slate-700" />}
            tone="slate"
          />
        </div>

        {/* Modules + Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Modules */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm font-extrabold text-gray-900">Modules</div>
              <div className="mt-1 text-xs text-gray-500">Accès rapide aux fonctionnalités principales.</div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <TileLink
                to="/CalendarComponent"
                title="Contrats"
                desc="Créer, modifier et suivre les contrats locataire ↔ station."
                icon={<FaFileContract />}
                accent="amber"
                badge="Gestion"
              />
              <TileLink
                to="/T3"
                title="Fiches Locataires"
                desc="Matricule fiscale, contact, adresse de facturation, téléphone, fax."
                icon={<FaUsers />}
                accent="indigo"
                badge="Fiches"
              />
              <TileLink
                to="/Te2"
                title="Facturation"
                desc="Calcul backend, impression PDF, stockage auto à l’impression."
                icon={<FaFileInvoiceDollar />}
                accent="rose"
                badge="PDF"
              />
              <TileLink
                to="/InteractifCalendarIns"
                title="Rapport Factures"
                desc="Recherche, filtrage et visualisation."
                icon={<FaChartLine />}
                accent="green"
                badge="Rapport"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm font-extrabold text-gray-900">Contact AGIL</div>
              <div className="mt-1 text-xs text-gray-500">Remplace xxxxx par les vraies informations.</div>
            </div>

            <div className="p-5 space-y-4">
              <InfoRow icon={<FaPhoneAlt />} label="Téléphone" value="xxxxx" />
              <InfoRow icon={<FaEnvelope />} label="Email" value="xxxxx@xxxxx.com" />
              <InfoRow icon={<FaGlobe />} label="Site web" value="www.xxxxx.com" />
              <InfoRow icon={<FaBuilding />} label="Adresse" value="xxxxx, xxxxx, xxxxx" />

              <div className="pt-4 border-t">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Support</div>
                <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                  Horaires : <span className="font-semibold">xxxxx</span> <br />
                  Responsable : <span className="font-semibold">xxxxx</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recherche / Filtre */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <FaFilter className="text-gray-600" /> Recherche &amp; Somme 
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Choisis <strong>Tous</strong> pour afficher tous (n1,n2,n3...) et enlever le filtre.
              </div>
            </div>
            <Pill tone="gray"><FaSearch /> Filtrer</Pill>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
            <ComboBox
              label="Station"
              icon={<FaBuilding />}
              value={filters.stationId}
              onChangeValue={(v) => setFilters((f) => ({ ...f, stationId: v }))}
              options={stationOptions}
              placeholder="Rechercher station..."
              help='Sélectionne "Tous" pour afficher toutes les stations.'
              includeAll
              allLabel="Tous"
              allSub="Toutes les stations"
              allValue=""
            />

            <ComboBox
              label="Locataire"
              icon={<FaUsers />}
              value={filters.locataireId}
              onChangeValue={(v) => setFilters((f) => ({ ...f, locataireId: v }))}
              options={locataireOptions}
              placeholder="Rechercher locataire..."
              help='Sélectionne "Tous" pour afficher tous les locataires.'
              includeAll
              allLabel="Tous"
              allSub="Tous les locataires"
              allValue=""
            />

            <ComboBox
              label="Mois (YYYY-MM)"
              icon={<FaClock />}
              value={filters.monthKey}
              onChangeValue={(v) => setFilters((f) => ({ ...f, monthKey: v, year: "" }))}
              options={monthOptions}
              placeholder="Rechercher mois..."
              help='Sélectionne "Tous" pour tous les mois.'
              includeAll
              allLabel="Tous"
              allSub="Tous les mois"
              allValue=""
            />

            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Année"
                icon={<FaClock />}
                value={filters.year}
                onChange={(v) => setFilters((f) => ({ ...f, year: v, monthKey: "" }))}
                placeholder="2025"
                help="Si rempli, ignore Mois."
              />
              <TextInput
                label="Code"
                icon={<FaHashtag />}
                value={filters.qCode}
                onChange={(v) => setFilters((f) => ({ ...f, qCode: v }))}
                placeholder="ex: 00101062025"
                help="Recherche par code."
              />
            </div>

            <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Pill tone="indigo">Résultats : <strong>{loading ? "…" : filteredFactures.length}</strong></Pill>
                <Pill tone="rose">Somme TTC : <strong>{loading ? "…" : `${fmt3(sumFiltered)} DT`}</strong></Pill>
              </div>

              <button
                type="button"
                onClick={() => setFilters({ stationId: "", locataireId: "", monthKey: "", year: "", qCode: "" })}
                className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold"
              >
                Réinitialiser (Tous)
              </button>
            </div>

            {/* Mini tableau des factures filtrées */}
            <div className="md:col-span-4 rounded-2xl border overflow-hidden">
              <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
                <div className="text-sm font-extrabold text-gray-900">Factures filtrées</div>
                <Pill tone="slate">DT • TTC</Pill>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Locataire</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Station</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Mois</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="px-4 py-4 text-gray-500" colSpan={6}>Chargement…</td></tr>
                    ) : filteredFactures.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-gray-500 text-center" colSpan={6}>
                          Aucun résultat avec ces filtres.
                        </td>
                      </tr>
                    ) : (
                      filteredFactures.slice(0, 20).map((f) => (
                        <tr key={f.id || `${f.facture_code}-${f.created_at}`} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">{f.facture_code_full || f.facture_code || "—"}</td>
                          <td className="px-4 py-3 text-gray-700">{f.locataire?.nom || "—"}</td>
                          <td className="px-4 py-3 text-gray-700">{f.station?.nom || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{monthKeyFromFacture(f)}</td>
                          <td className="px-4 py-3 text-gray-600">{f.date_facture || f.created_at || "—"}</td>
                          <td className="px-4 py-3 text-right font-bold text-rose-700">{fmt3(f.total_ttc)} DT</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 text-xs text-gray-500 flex items-center justify-between">
                <div>Affichage limité à 20 lignes.</div>
                <div className="font-semibold">Somme filtrée: {fmt3(sumFiltered)} DT</div>
              </div>
            </div>
          </div>
        </div>

        
        

        {/* Factures + Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">Dernières factures</div>
                <div className="mt-1 text-xs text-gray-500">Top 5 — basé sur toutes les pages concaténées.</div>
              </div>
              <Pill tone="gray"><FaClock /> Récent</Pill>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Locataire</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Station</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Total TTC</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr><td className="px-4 py-4 text-gray-500" colSpan={5}>Chargement…</td></tr>
                  ) : lastFactures.length === 0 ? (
                    <tr><td className="px-4 py-6 text-gray-500 text-center" colSpan={5}>Aucune facture trouvée.</td></tr>
                  ) : (
                    lastFactures.map((f) => (
                      <tr key={f.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{f.facture_code_full || f.facture_code || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{f.locataire?.nom || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{f.station?.nom || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{f.date_facture || f.created_at || "—"}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-700">{fmt3(f.total_ttc)} DT</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-5 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <FaCircle className="text-[10px] text-indigo-500" />
                Astuce : tu peux ajouter un “détail facture” plus tard (route).
              </div>
              <NavLink to="/InteractifCalendarIns" className="text-indigo-700 font-semibold hover:underline">
                Voir rapports <FaArrowRight className="inline ml-1" />
              </NavLink>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-b from-white to-gray-50">
              <div className="text-sm font-extrabold text-gray-900">Aperçu</div>
              <div className="mt-1 text-xs text-gray-500">Indicateurs rapides (sans librairies).</div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total TTC</div>
                <Pill tone="indigo"><FaChartLine /> Graph</Pill>
              </div>

              <MiniBarChart values={chartValues} />

              <div className="mt-6 rounded-xl border bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <FaBell className="text-amber-600" />
                  Activité (exemples)
                </div>
                <div className="mt-2 text-sm text-gray-600 leading-relaxed">
                  • Factures ce mois : <span className="font-semibold">xxxxx</span> <br />
                  • Contrats à renouveler : <span className="font-semibold">xxxxx</span> <br />
                  • Locataires actifs : <span className="font-semibold">xxxxx</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 py-4">© {new Date().getFullYear()} AGIL — Plateforme Gestion des Locataires — xxxxx</div>
      </div>
    </div>
  );
}
