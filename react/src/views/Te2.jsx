import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaCalculator,
  FaFilePdf,
  FaSpinner,
  FaBolt,
  FaTint,
  FaFire,
  FaUsers,
  FaPlusCircle,
  FaBuilding,
  FaUserTie,
  FaCalendarAlt,
  FaHashtag,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCommentDots,
  FaReceipt,
  FaChevronDown,
  FaCheck,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ Branding (AGIL)
import AgilLogo from "../assets/Agil_Logo.gif";
import { API_BASE_URL } from "../apiConfig";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

const cn = (...c) => c.filter(Boolean).join(" ");

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmt3 = (v) => toNum(v).toFixed(3);

// ====== numberToWordsFR (corrigé) ======
const numberToWordsFR = (n) => {
  const units = [
    "zéro",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "dix-sept",
    "dix-huit",
    "dix-neuf",
  ];
  const tens = [
    "",
    "",
    "vingt",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "soixante-dix",
    "quatre-vingt",
    "quatre-vingt-dix",
  ];

  const under100 = (num) => {
    if (num < 20) return units[num];
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    if (ten === 7 || ten === 9) {
      return tens[ten - 1] + (unit ? "-" + units[10 + unit] : "");
    }
    return tens[ten] + (unit ? "-" + units[unit] : "");
  };

  const under1000 = (num) => {
    if (num < 100) return under100(num);
    const h = Math.floor(num / 100);
    const r = num % 100;
    return (h > 1 ? units[h] + " " : "") + "cent" + (r ? " " + under100(r) : "");
  };

  const dinars = Math.floor(n);
  const millimes = Math.round((n - dinars) * 1000);

  let dinarsText = "";
  if (dinars >= 1000) {
    const t = Math.floor(dinars / 1000);
    const r = dinars % 1000;
    dinarsText = (t > 1 ? under1000(t) + " " : "") + "mille" + (r ? " " + under1000(r) : "");
  } else {
    dinarsText = under1000(dinars);
  }

  const millimesText = millimes > 0 ? under1000(millimes) + " millimes" : "zéro millime";

  return `${dinarsText} dinars et ${millimesText}`;
};

// ---------- UI ----------
const Badge = ({ children, tone = "gray" }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-green-50 text-green-700 border-green-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border font-semibold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
};

const Input = ({ label, icon, help, ...props }) => (
  <div>
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
      <span className="text-gray-500">{icon}</span>
      {label}
    </label>
    <input
      {...props}
      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition
      focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
    {help && <p className="mt-1 text-xs text-gray-500">{help}</p>}
  </div>
);

/**
 * ✅ Professional Combobox (searchable dropdown)
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
      const lab = (o.label || "").toLowerCase();
      const sub = (o.sub || "").toLowerCase();
      return lab.includes(s) || sub.includes(s);
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

const Modal = ({ open, title, subtitle, onClose, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 p-4 flex items-center justify-center">
        <div
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-gradient-to-b from-white to-gray-50 border-b">
            <div className="px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{subtitle || "Détails"}</div>
                <h3 className="mt-1 text-lg font-extrabold text-gray-900 truncate">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl border bg-white hover:bg-gray-50 flex items-center justify-center"
                title="Fermer"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>

          {footer ? <div className="sticky bottom-0 bg-white border-t px-6 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
};

const ChargeCard = ({ title, hint, icon, active, amount, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border p-4 shadow-sm transition",
        active ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200",
        "hover:bg-indigo-50 hover:border-indigo-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-1">{icon}</div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-gray-900 truncate">{title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{hint}</div>
          </div>
        </div>

        <div className="text-right">
          <div className={cn("text-sm font-extrabold", active ? "text-gray-900" : "text-gray-400")}>
            {active ? `${fmt3(amount)} DT` : "—"}
          </div>
          <div className={cn("text-xs font-semibold mt-0.5", active ? "text-emerald-700" : "text-gray-400")}>
            {active ? "Activé" : "Désactivé"}
          </div>
        </div>
      </div>
    </button>
  );
};

// -------- helpers PDF --------
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const formatFrenchDateLong = (d = new Date()) => {
  const months = [
    "JANVIER",
    "FÉVRIER",
    "MARS",
    "AVRIL",
    "MAI",
    "JUIN",
    "JUILLET",
    "AOÛT",
    "SEPTEMBRE",
    "OCTOBRE",
    "NOVEMBRE",
    "DÉCEMBRE",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `Le ${day} ${month} ${year}`;
};

// ✅ NEW: format court (JJ/MM/AAAA) pour la référence
const formatDateFRShort = (isoOrDate) => {
  if (!isoOrDate) return "";
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

export default function Te2() {
  const [locataires, setLocataires] = useState([]);
  const [stations, setStations] = useState([]);

  // ✅ NEW: fichelocs + contrats
  const [fichelocs, setFichelocs] = useState([]);
  const [contrats, setContrats] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);

  const [form, setForm] = useState({
    locataire_id: "",
    station_id: "",
    mois: "",
    date_facture: "",
    variable_ttc: "",
    electricite_ht: "",
    eau_ht: "",
    gaz_ht: "",
    personnel_ht: "",
    charge_complementaire_ht: "",
    charge_complementaire_comment: "",
  });

  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [chargeModal, setChargeModal] = useState({ open: false, key: null });
  const [tempAmount, setTempAmount] = useState("");
  const [tempComment, setTempComment] = useState("");

  const [openDivers, setOpenDivers] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [locRes, staRes, ficheRes, contratRes] = await Promise.all([
          API.get("/locataires"),
          API.get("/stations"),
          // ✅ il faut GET /api/fichelocs
          API.get("/fichelocs"),
          // ✅ il faut GET /api/contrats
          API.get("/contrats"),
        ]);
        setLocataires(locRes.data || []);
        setStations(staRes.data || []);
        setFichelocs(ficheRes.data || []);
        setContrats(contratRes.data || []);
      } catch (e) {
        console.error(e);
        setErrorMsg("Erreur chargement des données.");
      }
    })();
  }, []);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const useElec = useMemo(() => toNum(form.electricite_ht) > 0, [form.electricite_ht]);
  const useEau = useMemo(() => toNum(form.eau_ht) > 0, [form.eau_ht]);
  const useGaz = useMemo(() => toNum(form.gaz_ht) > 0, [form.gaz_ht]);
  const usePersonnel = useMemo(() => toNum(form.personnel_ht) > 0, [form.personnel_ht]);
  const useChargeComp = useMemo(
    () => toNum(form.charge_complementaire_ht) > 0 || (form.charge_complementaire_comment || "").trim().length > 0,
    [form.charge_complementaire_ht, form.charge_complementaire_comment]
  );

  const payload = useMemo(() => {
    return {
      locataire_id: form.locataire_id,
      station_id: form.station_id,
      mois: Number(form.mois),
      date_facture: form.date_facture,
      variable_ttc: Number(form.variable_ttc),

      electricite_ht: useElec ? Number(form.electricite_ht || 0) : 0,
      eau_ht: useEau ? Number(form.eau_ht || 0) : 0,
      gaz_ht: useGaz ? Number(form.gaz_ht || 0) : 0,
      personnel_ht: usePersonnel ? Number(form.personnel_ht || 0) : 0,

      charge_complementaire_ht: useChargeComp ? Number(form.charge_complementaire_ht || 0) : 0,
      charge_complementaire_comment: useChargeComp ? (form.charge_complementaire_comment || "").trim() : "",
    };
  }, [form, useElec, useEau, useGaz, usePersonnel, useChargeComp]);

  const factureCodeFull = useMemo(() => result?.facture_code_full || result?.facture_code || "", [result]);

  const totalTTCWords = useMemo(() => {
    if (!result) return "";
    return numberToWordsFR(toNum(result.total_ttc));
  }, [result]);

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

  // ---- robust relation/name resolver ----
  const pickFirst = (obj, keys) => {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null) return v;
    }
    return null;
  };

  const getRelName = (rel) => {
    if (!rel) return "";
    const r = Array.isArray(rel) ? rel[0] : rel;
    return r?.nom || r?.name || r?.Nom || r?.libelle || "";
  };

  const resolveLocataireName = (f) => {
    const rel = pickFirst(f, ["locataire", "Locataire", "locataires", "Locataires", "LOCATAIRE"]);
    const nameFromRel = getRelName(rel);
    if (nameFromRel) return nameFromRel;

    const id = pickFirst(f, ["locataire_id", "locataireId", "locataireID"]);
    if (id) {
      const found = (locataires || []).find((l) => String(l.id) === String(id));
      return found?.nom || found?.name || "";
    }
    return "";
  };

  const resolveStationName = (f) => {
    const rel = pickFirst(f, ["station", "Station", "stations", "Stations", "STATION"]);
    const nameFromRel = getRelName(rel);
    if (nameFromRel) return nameFromRel;

    const id = pickFirst(f, ["station_id", "stationId", "stationID"]);
    if (id) {
      const found = (stations || []).find((s) => String(s.id) === String(id));
      return found?.nom || found?.name || "";
    }
    return "";
  };

  // ✅ NEW: récupérer une fiche loc (ficheloc) par locataire+station
  const resolveFicheLoc = (f) => {
    const locId = pickFirst(f, ["locataire_id", "locataireId", "locataireID"]) || form.locataire_id;
    const staId = pickFirst(f, ["station_id", "stationId", "stationID"]) || form.station_id;

    if (!locId) return null;

    const exact = (fichelocs || []).find(
      (x) => String(x.locataire_id) === String(locId) && String(x.station_id) === String(staId)
    );
    if (exact) return exact;

    const byLoc = (fichelocs || []).find((x) => String(x.locataire_id) === String(locId));
    return byLoc || null;
  };

  const resolveAdresseFacturation = (f) => {
    const rel = pickFirst(f, ["ficheloc", "ficheLoc", "Ficheloc", "fichelocs", "Fichelocs"]);
    const relObj = Array.isArray(rel) ? rel[0] : rel;
    if (relObj?.adresse_facturation) return String(relObj.adresse_facturation);

    const fiche = resolveFicheLoc(f);
    return fiche?.adresse_facturation ? String(fiche.adresse_facturation) : "";
  };

  // ✅ NEW: matricule fiscale depuis ficheloc
  const resolveMatriculeFiscale = (f) => {
    const rel = pickFirst(f, ["ficheloc", "ficheLoc", "Ficheloc", "fichelocs", "Fichelocs"]);
    const relObj = Array.isArray(rel) ? rel[0] : rel;
    if (relObj?.matricule_fiscale) return String(relObj.matricule_fiscale);

    const fiche = resolveFicheLoc(f);
    return fiche?.matricule_fiscale ? String(fiche.matricule_fiscale) : "";
  };

  // ✅ NEW: chercher contrat par locataire+station (pour objet)
  const resolveContrat = (f) => {
    const rel = pickFirst(f, ["contrat", "Contrat", "contrats", "Contrats"]);
    const relObj = Array.isArray(rel) ? rel[0] : rel;
    if (relObj?.objet) return relObj;

    const locId = pickFirst(f, ["locataire_id", "locataireId", "locataireID"]) || form.locataire_id;
    const staId = pickFirst(f, ["station_id", "stationId", "stationID"]) || form.station_id;
    if (!locId || !staId) return null;

    // si plusieurs contrats, on prend le dernier (par id ou date_debut)
    const matches = (contrats || []).filter(
      (c) => String(c.locataire_id) === String(locId) && String(c.station_id) === String(staId)
    );
    if (matches.length === 0) return null;

    // try sort by date_debut then id
    matches.sort((a, b) => {
      const da = a?.date_debut ? new Date(a.date_debut).getTime() : 0;
      const db = b?.date_debut ? new Date(b.date_debut).getTime() : 0;
      if (da !== db) return db - da;
      return (b?.id || 0) - (a?.id || 0);
    });
    return matches[0];
  };

  const buildReferenceLine = (f) => {
    const contrat = resolveContrat(f);
    const objet = contrat?.objet ? String(contrat.objet) : "—";
    const staName = resolveStationName(f) || "—";
    const dt = f?.date_facture || form.date_facture;
    const dtStr = dt ? formatDateFRShort(dt) : "";

    // "Référence de facturation : Contrat ... {objet} dans la station services {station} ({date})"
    return `Référence de facturation : Contrat de Location et de Gestion d'espaces ${objet} dans la station services ${staName}${dtStr ? ` (${dtStr})` : ""}`;
  };

  const diversItems = useMemo(() => {
    if (!result) return [];
    return [
      { key: "electricite", label: "Électricité", icon: <FaBolt className="text-amber-500" />, amount: result.electricite_ht },
      { key: "eau", label: "Eau", icon: <FaTint className="text-sky-500" />, amount: result.eau_ht },
      { key: "gaz", label: "Gaz", icon: <FaFire className="text-rose-500" />, amount: result.gaz_ht },
      { key: "personnel", label: "Personnel", icon: <FaUsers className="text-indigo-600" />, amount: result.personnel_ht },
      {
        key: "charge_comp",
        label: result.charge_complementaire_comment
          ? `Charge complémentaire (${result.charge_complementaire_comment})`
          : "Charge complémentaire",
        icon: <FaPlusCircle className="text-emerald-600" />,
        amount: result.charge_complementaire_ht,
      },
    ];
  }, [result]);

  const diversTotal = useMemo(() => diversItems.reduce((acc, it) => acc + toNum(it.amount), 0), [diversItems]);

  // ---- Charge modal ----
  const openChargeModal = (key) => {
    setErrorMsg("");
    setChargeModal({ open: true, key });

    if (key === "electricite") setTempAmount(form.electricite_ht || "");
    if (key === "eau") setTempAmount(form.eau_ht || "");
    if (key === "gaz") setTempAmount(form.gaz_ht || "");
    if (key === "personnel") setTempAmount(form.personnel_ht || "");

    if (key === "charge_comp") {
      setTempAmount(form.charge_complementaire_ht || "");
      setTempComment(form.charge_complementaire_comment || "");
    } else {
      setTempComment("");
    }
  };

  const closeChargeModal = () => {
    setChargeModal({ open: false, key: null });
    setTempAmount("");
    setTempComment("");
  };

  const saveChargeModal = () => {
    const key = chargeModal.key;
    const amt = tempAmount === "" ? "" : String(tempAmount);

    if (!key) return;

    if (amt !== "" && toNum(amt) < 0) {
      setErrorMsg("Le montant doit être positif.");
      return;
    }

    if (key === "charge_comp") {
      const c = (tempComment || "").trim();
      if (toNum(amt) > 0 && !c) {
        setErrorMsg("Veuillez saisir un commentaire pour la charge complémentaire (ex: poubelle).");
        return;
      }
      setForm((f) => ({
        ...f,
        charge_complementaire_ht: amt,
        charge_complementaire_comment: c,
      }));
    } else {
      const map = {
        electricite: "electricite_ht",
        eau: "eau_ht",
        gaz: "gaz_ht",
        personnel: "personnel_ht",
      };
      setForm((f) => ({ ...f, [map[key]]: amt }));
    }

    closeChargeModal();
  };

  const disableCharge = () => {
    const key = chargeModal.key;
    if (!key) return;

    if (key === "charge_comp") {
      setForm((f) => ({
        ...f,
        charge_complementaire_ht: "",
        charge_complementaire_comment: "",
      }));
    } else {
      const map = {
        electricite: "electricite_ht",
        eau: "eau_ht",
        gaz: "gaz_ht",
        personnel: "personnel_ht",
      };
      setForm((f) => ({ ...f, [map[key]]: "" }));
    }

    closeChargeModal();
  };

  // ---- VALIDATION corrigée ----
  const validateRequired = () => {
    if (!form.locataire_id) return "Veuillez sélectionner un locataire.";
    if (!form.station_id) return "Veuillez sélectionner une station.";
    if (!form.mois) return "Veuillez saisir le mois.";
    if (!form.date_facture) return "Veuillez saisir la date facture.";
    if (form.variable_ttc === "" || form.variable_ttc === null || form.variable_ttc === undefined)
      return "Veuillez saisir la redevance variable (TTC).";
    if (toNum(form.variable_ttc) < 0) return "Variable TTC doit être positif.";

    if (useChargeComp && toNum(form.charge_complementaire_ht) > 0 && !(form.charge_complementaire_comment || "").trim()) {
      return "Veuillez saisir un commentaire pour la charge complémentaire (ex: poubelle).";
    }
    return "";
  };

  const calculerFacture = async () => {
    setErrorMsg("");
    const err = validateRequired();
    if (err) {
      setErrorMsg(err);
      toast.warning(err);
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/facturation/calculate", payload);
      setResult(res.data);
      toast.success("Calcul de la facture effectue avec succes.");
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur lors du calcul.");
      toast.error(e?.response?.data?.message || "Erreur lors du calcul de la facture.");
    }
    setLoading(false);
  };

  // ---- PDF ----
  const generatePdfFromStoredFacture = async (f) => {
    if (!f) return;

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const codeFull = f.facture_code_full || f.facture_code || "";
    const locName = resolveLocataireName(f) || "—";
    const adresseFact = resolveAdresseFacturation(f) || "—";
    const matFisc = resolveMatriculeFiscale(f) || "—";

    // ---- Header ----
    try {
      const img = await loadImage(AgilLogo);
      const logoW = 22;
      const logoH = 22;
      doc.addImage(img, "PNG", (pageW - logoW) / 2, 10, logoW, logoH);
    } catch {}

    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("Société AGIL de Gestion et de Services S.A «S.A.G.E.S»", pageW / 2, 40, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(10, 50, pageW - 10, 50);

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(`FACTURE N° : ${codeFull}`, 15, 60);
    doc.text(`DATE : ${formatFrenchDateLong(new Date())}`, pageW - 15, 60, { align: "right" });

    // ===============================
    // Bloc ENVOYÉ À (À DROITE)
    // ===============================
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("ENVOYÉ À", pageW - 15, 72, { align: "right" });

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(locName, pageW - 15, 79, { align: "right" });

    // Adresse
    doc.setFontSize(10);
    doc.text(adresseFact, pageW - 15, 85, { align: "right", maxWidth: 80 });

    // ✅ NEW: Matricule fiscale sous l'adresse
    doc.setFontSize(10);
    doc.text(`Matricule fiscale : ${matFisc}`, pageW - 15, 91, { align: "right", maxWidth: 80 });

    // ✅ NEW: Référence dynamique (objet contrat + station + date_facture)
    const refText = buildReferenceLine(f);

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(refText, 15, 97, { maxWidth: pageW - 30 });
    doc.setTextColor(0, 0, 0);

    // ---- Table ----
    const rows = [];
    const addLine = (desc, qty, pu, total) => rows.push([desc, qty, pu, total]);

    if (toNum(f.loyer_fixe_ht) > 0)
      addLine(
        `Fixe mois : ${String(f.mois).padStart(2, "0")}/${String(f.annee || "").slice(0, 4)}`,
        "1",
        fmt3(f.loyer_fixe_ht),
        fmt3(f.loyer_fixe_ht)
      );

    if (toNum(f.redevance_htva) > 0)
      addLine(
        `Variable mois : ${String(f.mois).padStart(2, "0")}/${String(f.annee || "").slice(0, 4)}`,
        "1",
        fmt3(f.redevance_htva),
        fmt3(f.redevance_htva)
      );

    if (toNum(f.electricite_ht) > 0) addLine("CONSOMMATION ELECTRICITE", "1", fmt3(f.electricite_ht), fmt3(f.electricite_ht));
    if (toNum(f.eau_ht) > 0) addLine("CONSOMMATION EAU", "1", fmt3(f.eau_ht), fmt3(f.eau_ht));
    if (toNum(f.gaz_ht) > 0) addLine("CONSOMMATION GAZ", "1", fmt3(f.gaz_ht), fmt3(f.gaz_ht));
    if (toNum(f.personnel_ht) > 0) addLine("PERSONNEL", "1", fmt3(f.personnel_ht), fmt3(f.personnel_ht));

    if (toNum(f.charge_complementaire_ht) > 0) {
      const label = f.charge_complementaire_comment
        ? `CHARGE COMPLEMENTAIRE (${f.charge_complementaire_comment})`
        : "CHARGE COMPLEMENTAIRE";
      addLine(label, "1", fmt3(f.charge_complementaire_ht), fmt3(f.charge_complementaire_ht));
    }

    const startY = 105; // ✅ un peu plus bas car on a ajouté matricule + référence
    autoTable(doc, {
      startY,
      head: [["DESCRIPTION", "QUANTITÉ", "PRIX UNITAIRE", "TOTAL"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2, textColor: 0 },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 95 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
      },
      margin: { left: 15, right: 15 },
    });

    const lastY = doc.lastAutoTable?.finalY || startY + 40;

    const boxX = pageW - 15 - 60;
    let y = lastY + 6;

    doc.setFont("times", "normal");
    doc.setFontSize(10);

    const lineTotal = (label, value, bold = false) => {
      doc.setFont("times", bold ? "bold" : "normal");
      doc.text(label, boxX, y);
      doc.text(value, pageW - 15, y, { align: "right" });
      y += 6;
    };

    lineTotal("SOUS-TOTAL", fmt3(f.total_htva));
    lineTotal("TVA 19%", fmt3(f.tva_19));
    lineTotal("TIMBRES", fmt3(f.timber));
    doc.setLineWidth(0.3);
    doc.line(boxX, y, pageW - 15, y);
    y += 6;
    lineTotal("TOTAL", fmt3(f.total_ttc), true);

    const words = numberToWordsFR(toNum(f.total_ttc));
    const wordsY = Math.min(y + 8, pageH - 35);

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Arrêtée la présente facture à la somme de :", 15, wordsY);
    doc.setFont("times", "bold");
    doc.text(words.toUpperCase(), 15, wordsY + 6, { maxWidth: pageW - 30 });

    // ---- Footer fixe + RIB ----
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(10, pageH - 25, pageW - 10, pageH - 25);

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    doc.text("RIB BANCAIRE : 03 000 010 0115 008740 73 (BNA AVENUE DE PARIS)", pageW / 2, pageH - 18, {
      align: "center",
    });

    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      "Société Anonyme au Capital de 1.500.000 Dinars — Siège Social : av. Mohamed Ali Akid, Cité Olympique, 1003 EL Khadra - Tunis",
      pageW / 2,
      pageH - 11,
      { align: "center", maxWidth: pageW - 20 }
    );
    doc.text("Tel : 71 703 322 — Fax : 71 704 333 — TVA : 000MP1400127/Z", pageW / 2, pageH - 7, {
      align: "center",
    });

    doc.setTextColor(0, 0, 0);

    const filename = `facture_${f.facture_code || "facture"}${f.facture_suffix ? "_" + f.facture_suffix : ""}.pdf`;
    doc.save(filename);
  };

  const imprimerEtStocker = async () => {
    setErrorMsg("");
    const err = validateRequired();
    if (err) {
      setErrorMsg(err);
      toast.warning(err);
      return;
    }

    setLoadingPrint(true);
    try {
      const storeRes = await API.post("/facturation/store", payload);
      const storedFacture = storeRes.data?.facture;

      await generatePdfFromStoredFacture(storedFacture);

      setResult({
        facture_code: storedFacture.facture_code,
        facture_code_full: storedFacture.facture_code_full,
        facture_suffix: storedFacture.facture_suffix,

        locataire: resolveLocataireName(storedFacture) || resolveLocataireName({ locataire_id: form.locataire_id }),
        station: resolveStationName(storedFacture) || resolveStationName({ station_id: form.station_id }),

        mois: storedFacture.mois,
        annee: storedFacture.annee,
        date: storedFacture.date_facture,

        loyer_fixe_ht: storedFacture.loyer_fixe_ht,
        redevance_htva: storedFacture.redevance_htva,

        electricite_ht: storedFacture.electricite_ht,
        eau_ht: storedFacture.eau_ht,
        gaz_ht: storedFacture.gaz_ht,
        personnel_ht: storedFacture.personnel_ht,

        charge_complementaire_ht: storedFacture.charge_complementaire_ht,
        charge_complementaire_comment: storedFacture.charge_complementaire_comment,

        total_htva: storedFacture.total_htva,
        tva_19: storedFacture.tva_19,
        timber: storedFacture.timber,
        total_ttc: storedFacture.total_ttc,
      });
      toast.success("Facture enregistree et PDF genere avec succes.");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Erreur lors de l'enregistrement de la facture.");
      setErrorMsg("Erreur stockage/impression. Vérifie l’API /facturation/store.");
    }
    setLoadingPrint(false);
  };

  const chargeModalTitle = useMemo(() => {
    const k = chargeModal.key;
    if (k === "electricite") return "Électricité";
    if (k === "eau") return "Eau";
    if (k === "gaz") return "Gaz";
    if (k === "personnel") return "Personnel";
    if (k === "charge_comp") return "Charge complémentaire";
    return "Charge";
  }, [chargeModal.key]);

  const chargeModalIcon = useMemo(() => {
    const k = chargeModal.key;
    if (k === "electricite") return <FaBolt className="text-amber-500" />;
    if (k === "eau") return <FaTint className="text-sky-500" />;
    if (k === "gaz") return <FaFire className="text-rose-500" />;
    if (k === "personnel") return <FaUsers className="text-indigo-600" />;
    if (k === "charge_comp") return <FaPlusCircle className="text-emerald-600" />;
    return <FaInfoCircle className="text-gray-500" />;
  }, [chargeModal.key]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO / BRAND */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-25">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-emerald-500 blur-3xl" />
        </div>

        <div className="relative border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-7 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-sm">
                <img src={AgilLogo} alt="AGIL" className="w-full h-full object-contain" />
              </div>

              <div className="text-white">
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  SAGES • Société de Gestion &amp; Service
                </div>
                <h1 className="mt-1 text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                  <FaReceipt className="text-white/90" />
                  Facturation Locataire
                </h1>
                <p className="mt-2 text-sm text-white/70 max-w-2xl leading-relaxed">
                  Calcul backend • PDF template-like • Stockage à l’impression
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {factureCodeFull ? (
                    <>
                      <Badge tone="slate">
                        <FaHashtag />
                        {factureCodeFull}
                      </Badge>

                      {result?.facture_suffix?.includes("F") && <Badge tone="green">F • Fixe</Badge>}
                      {result?.facture_suffix?.includes("V") && <Badge tone="rose">V • Variable</Badge>}
                      {result?.facture_suffix?.includes("D") && <Badge tone="amber">D • Divers</Badge>}
                    </>
                  ) : (
                    <Badge tone="slate">Code après calcul</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full md:w-[380px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-white">
              <div className="text-sm font-extrabold">Rappel</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">
                Le bouton <strong>Imprimer (stocke)</strong> appelle{" "}
                <code className="text-white/80">/facturation/store</code> puis génère le PDF avec
                en-tête/footer fixes.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-b from-white to-gray-50">
              <h2 className="text-base font-extrabold text-gray-900">Informations de facture</h2>
              <p className="text-sm text-gray-500 mt-1">Renseignez les champs requis, calculez, puis imprimez.</p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComboBox
                label="Locataire"
                icon={<FaUserTie />}
                value={form.locataire_id}
                onChangeValue={(v) => {
                  setForm((f) => ({ ...f, locataire_id: v }));
                  if (errorMsg) setErrorMsg("");
                }}
                options={locataireOptions}
                placeholder="Rechercher un locataire..."
                help="Tapez pour filtrer (nom / numéro)."
              />

              <ComboBox
                label="Station"
                icon={<FaBuilding />}
                value={form.station_id}
                onChangeValue={(v) => {
                  setForm((f) => ({ ...f, station_id: v }));
                  if (errorMsg) setErrorMsg("");
                }}
                options={stationOptions}
                placeholder="Rechercher une station..."
                help="Tapez pour filtrer (nom / numéro)."
              />

              <Input
                label="Mois"
                icon={<FaCalendarAlt />}
                type="number"
                min="1"
                max="12"
                name="mois"
                value={form.mois}
                onChange={onChange}
              />

              <Input
                label="Date facture"
                icon={<FaCalendarAlt />}
                type="date"
                name="date_facture"
                value={form.date_facture}
                onChange={onChange}
              />

              <div className="md:col-span-2">
                <Input
                  label="Redevance Variable (TTC)"
                  icon={<FaHashtag />}
                  type="number"
                  min="0"
                  name="variable_ttc"
                  value={form.variable_ttc}
                  onChange={onChange}
                  help="Le backend convertit en HTVA (/1.07) puis applique le % du contrat."
                />
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-gray-900">Charges optionnelles (HTVA)</h3>
                <span className="text-xs text-gray-500">Cliquez sur une carte pour saisir le montant</span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <ChargeCard
                  title="Électricité"
                  hint="Saisir le montant HTVA"
                  icon={<FaBolt className="text-amber-500" />}
                  active={useElec}
                  amount={form.electricite_ht}
                  onClick={() => openChargeModal("electricite")}
                />

                <ChargeCard
                  title="Eau"
                  hint="Saisir le montant HTVA"
                  icon={<FaTint className="text-sky-500" />}
                  active={useEau}
                  amount={form.eau_ht}
                  onClick={() => openChargeModal("eau")}
                />

                <ChargeCard
                  title="Gaz"
                  hint="Saisir le montant HTVA"
                  icon={<FaFire className="text-rose-500" />}
                  active={useGaz}
                  amount={form.gaz_ht}
                  onClick={() => openChargeModal("gaz")}
                />

                <ChargeCard
                  title="Personnel"
                  hint="Saisir le montant HTVA"
                  icon={<FaUsers className="text-indigo-600" />}
                  active={usePersonnel}
                  amount={form.personnel_ht}
                  onClick={() => openChargeModal("personnel")}
                />

                <ChargeCard
                  title="Charge complémentaire"
                  hint="Commentaire + montant HTVA"
                  icon={<FaPlusCircle className="text-emerald-600" />}
                  active={useChargeComp && toNum(form.charge_complementaire_ht) > 0}
                  amount={form.charge_complementaire_ht}
                  onClick={() => openChargeModal("charge_comp")}
                />
              </div>

              {errorMsg && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                  <FaExclamationTriangle className="mt-0.5" />
                  <div className="text-sm font-semibold">{errorMsg}</div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={calculerFacture}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaCalculator />}
                  Calculer
                </button>

                <button
                  onClick={imprimerEtStocker}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-rose-700"
                >
                  {loadingPrint ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                  Imprimer (stocke)
                </button>

                {result && (
                  <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                    <FaCheckCircle className="text-green-600" />
                    Calcul disponible
                  </div>
                )}
              </div>

              {result && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-extrabold text-gray-900">Détail</h2>
                      <p className="text-xs text-gray-500 mt-1">Montants affichés en DT (3 décimales).</p>
                    </div>

                    {factureCodeFull ? (
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone="indigo">
                          <FaHashtag />
                          {factureCodeFull}
                        </Badge>
                        <div className="flex gap-2">
                          {result?.facture_suffix?.includes("F") && <Badge tone="green">F • Fixe</Badge>}
                          {result?.facture_suffix?.includes("V") && <Badge tone="rose">V • Variable</Badge>}
                          {result?.facture_suffix?.includes("D") && <Badge tone="amber">D • Divers</Badge>}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border bg-white p-4">
                      <div className="text-xs text-gray-500">Loyer fixe HTVA</div>
                      <div className="mt-1 text-lg font-extrabold text-gray-900">{fmt3(result.loyer_fixe_ht)} DT</div>
                    </div>

                    <div className="rounded-2xl border bg-white p-4">
                      <div className="text-xs text-gray-500">Redevance HTVA</div>
                      <div className="mt-1 text-lg font-extrabold text-gray-900">{fmt3(result.redevance_htva)} DT</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenDivers(true)}
                      className={cn("rounded-2xl border bg-white p-4 text-left transition", "hover:bg-indigo-50 hover:border-indigo-200")}
                      title="Voir les divers en détail"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Divers (HTVA)</div>
                          <div className="mt-1 font-extrabold text-gray-900">{fmt3(diversTotal)} DT</div>
                          <div className="mt-2 text-xs text-gray-500">Cliquez pour ouvrir le détail</div>
                        </div>
                        <div className="mt-1 text-indigo-600">
                          <FaInfoCircle />
                        </div>
                      </div>
                    </button>

                    <div className="rounded-2xl border bg-white p-4">
                      <div className="text-xs text-gray-500">Totaux</div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total HTVA</span>
                          <span className="font-extrabold">{fmt3(result.total_htva)} DT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">TVA 19%</span>
                          <span className="font-extrabold">{fmt3(result.tva_19)} DT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Timber</span>
                          <span className="font-extrabold">{fmt3(result.timber)} DT</span>
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between">
                          <span className="text-gray-900 font-extrabold">Total TTC</span>
                          <span className="text-gray-900 font-extrabold">{fmt3(result.total_ttc)} DT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm">
                    <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Montant en lettres</div>
                    <div className="mt-1 font-semibold text-indigo-900">{totalTTCWords}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm sticky top-6 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 border flex items-center justify-center">
                <img src={AgilLogo} alt="AGIL" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-gray-900">SAGES • AGIL</div>
                <div className="text-xs text-gray-500">Facturation &amp; suivi</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600 leading-relaxed">
              <p>
                <strong>Calculer</strong> = affichage des montants calculés par le backend.
              </p>
              <p className="mt-2">
                <strong>Imprimer (stocke)</strong> = création facture en base + PDF (en-tête/footer fixes).
              </p>
              <p className="mt-2">Charge complémentaire : commentaire requis si un montant est saisi.</p>
            </div>

            <div className="mt-4 rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
              <div className="font-extrabold text-gray-900 mb-1">Conseil</div>
              Après impression, vous pouvez retrouver la facture dans{" "}
              <code className="px-1 py-0.5 rounded bg-white border">/factures</code>.
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CHARGES */}
      <Modal
        open={chargeModal.open}
        onClose={closeChargeModal}
        subtitle="Charge optionnelle (HTVA)"
        title={chargeModalTitle}
        footer={
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={disableCharge}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-extrabold text-gray-800"
              title="Désactiver (mettre à 0)"
            >
              Désactiver
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeChargeModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold"
              >
                <FaTimes /> Annuler
              </button>
              <button
                type="button"
                onClick={saveChargeModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold"
              >
                <FaCheck /> Enregistrer
              </button>
            </div>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">{chargeModalIcon}</div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-gray-900">{chargeModalTitle}</div>
            <div className="text-xs text-gray-500 mt-1">
              Saisissez le montant <strong>HTVA</strong>. Laissez vide pour désactiver.
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4">
          {chargeModal.key === "charge_comp" && (
            <div>
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-gray-500">
                  <FaCommentDots />
                </span>
                Commentaire (obligatoire si montant &gt; 0)
              </label>
              <input
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                placeholder="Ex: poubelle, entretien..."
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition
                focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Exemple: <em>poubelle</em>, <em>entretien</em>, <em>divers</em>...
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-gray-500">
                <FaHashtag />
              </span>
              Montant (DT) — HTVA
            </label>
            <input
              type="number"
              min="0"
              value={tempAmount}
              onChange={(e) => setTempAmount(e.target.value)}
              placeholder="0.000"
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition
              focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Astuce: mettez <strong>0</strong> ou vide pour désactiver.
            </p>
          </div>

          {chargeModal.key === "charge_comp" && toNum(tempAmount) > 0 && !(tempComment || "").trim() ? (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <FaExclamationTriangle className="mt-0.5" />
              <div className="text-sm font-semibold">Commentaire requis pour la charge complémentaire.</div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* POPUP DIVERS */}
      <Modal
        open={openDivers}
        onClose={() => setOpenDivers(false)}
        subtitle="Détail des divers"
        title={factureCodeFull ? `Facture ${factureCodeFull}` : "Divers (HTVA)"}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              Total divers (HTVA): <span className="font-extrabold text-gray-900">{fmt3(diversTotal)} DT</span>
            </div>
            <button
              onClick={() => setOpenDivers(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-extrabold"
            >
              <FaTimes /> Fermer
            </button>
          </div>
        }
      >
        {!result ? (
          <div className="text-sm text-gray-500">Aucune donnée.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Locataire</div>
                <div className="mt-1 font-extrabold text-gray-900">{result.locataire || "—"}</div>
              </div>
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Station</div>
                <div className="mt-1 font-extrabold text-gray-900">{result.station || "—"}</div>
              </div>
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Mois</div>
                <div className="mt-1 font-extrabold text-gray-900">
                  {result.mois ? String(result.mois).padStart(2, "0") : "—"} /{" "}
                  {result.date ? String(result.date).slice(0, 4) : "—"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <div className="px-5 py-3 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
                <div className="text-sm font-extrabold text-gray-900">Lignes divers (HTVA)</div>
                <Badge tone="slate">DT • 3 décimales</Badge>
              </div>

              <div className="divide-y">
                {diversItems.map((it) => (
                  <div key={it.key} className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1">{it.icon}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-gray-900 truncate">{it.label}</div>
                        <div className="text-xs text-gray-500">Montant HTVA (DT)</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={cn("text-sm font-extrabold", toNum(it.amount) > 0 ? "text-gray-900" : "text-gray-400")}>
                        {fmt3(it.amount)} DT
                      </div>
                      {toNum(it.amount) > 0 ? (
                        <div className="text-xs text-emerald-700 font-semibold">Inclus</div>
                      ) : (
                        <div className="text-xs text-gray-400 font-semibold">0.000</div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="px-5 py-4 bg-gray-50 flex items-center justify-between">
                  <div className="text-sm font-extrabold text-gray-900">Total divers (HTVA)</div>
                  <div className="text-sm font-extrabold text-gray-900">{fmt3(diversTotal)} DT</div>
                </div>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
