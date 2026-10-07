import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSearch,
  FaSpinner,
  FaIdCard,
  FaUserTie,
  FaBuilding,
  FaPhoneAlt,
  FaFax,
  FaMapMarkerAlt,
  FaChevronDown,
  FaCheck,
} from "react-icons/fa";

// ✅ Branding (AGIL)
// Place le fichier ici: src/assets/Agil_Logo.gif
import AgilLogo from "../assets/Agil_Logo.gif";
import { API_BASE_URL } from "../apiConfig";

// ================= API =================
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const cn = (...c) => c.filter(Boolean).join(" ");
const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

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
      const a = (o.label || "").toLowerCase();
      const b = (o.sub || "").toLowerCase();
      return a.includes(s) || b.includes(s);
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
    <div className="relative" ref={wrapRef}>
      <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
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
            {selected ? selected.label : "-- Sélectionner --"}
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

export default function T3() {
  // ---------------- STATES ----------------
  const [fichelocs, setFichelocs] = useState([]);
  const [locataires, setLocataires] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ✅ UI only
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // ✅ Modal UX (scroll + animation + ESC)
  const [modalAnim, setModalAnim] = useState(false);

  const [form, setForm] = useState({
    locataire_id: "",
    station_id: "",
    matricule_fiscale: "",
    adresse_facturation: "",
    contact: "",
    num_tel: "",
    fax: "",
  });

  // ---------------- LOAD DATA ----------------
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [fRes, lRes, sRes] = await Promise.all([
        API.get("/fichelocs"),
        API.get("/locataires"),
        API.get("/stations"),
      ]);

      setFichelocs(fRes.data);
      setLocataires(lRes.data);
      setStations(sRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des donnees.");
    }
    setLoading(false);
  };

  // ---------------- HANDLERS ----------------
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      locataire_id: "",
      station_id: "",
      matricule_fiscale: "",
      adresse_facturation: "",
      contact: "",
      num_tel: "",
      fax: "",
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      locataire_id: row.locataire_id,
      station_id: row.station_id,
      matricule_fiscale: row.matricule_fiscale,
      adresse_facturation: row.adresse_facturation || "",
      contact: row.contact || "",
      num_tel: row.num_tel || "",
      fax: row.fax || "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setModalAnim(false);
    setTimeout(() => setOpen(false), 160);
  };

  const save = async () => {
    if (!form.locataire_id || !form.station_id || !form.matricule_fiscale) {
      toast.warning("Locataire, station et matricule fiscale sont obligatoires.");
      return;
    }

    try {
      if (editingId) {
        await API.put(`/fichelocs/${editingId}`, form);
        toast.success("Fiche locataire modifiee avec succes.");
      } else {
        await API.post("/fichelocs", form);
        toast.success("Fiche locataire creee avec succes.");
      }
      closeModal();
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Erreur lors de la sauvegarde.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer cette fiche ?")) return;
    try {
      await API.delete(`/fichelocs/${id}`);
      toast.success("Fiche locataire supprimee avec succes.");
      loadAll();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Erreur lors de la suppression.");
    }
  };

  // ---------------- SEARCH + PAGINATION (design only) ----------------
  const filtered = useMemo(() => {
    const query = (q || "").toLowerCase().trim();
    if (!query) return fichelocs;

    return fichelocs.filter((f) => {
      const a = (f?.locataire?.nom || "").toLowerCase();
      const b = (f?.station?.nom || "").toLowerCase();
      const c = (f?.matricule_fiscale || "").toLowerCase();
      const d = (f?.contact || "").toLowerCase();
      const e = (f?.num_tel || "").toLowerCase();
      return (
        a.includes(query) ||
        b.includes(query) ||
        c.includes(query) ||
        d.includes(query) ||
        e.includes(query)
      );
    });
  }, [fichelocs, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  useEffect(() => setPage(1), [q]);

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

  // ---------------- MODAL UX: lock scroll + ESC ----------------
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

  // ================= RENDER =================
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
          <div className="max-w-6xl mx-auto px-6 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-sm">
                <img
                  src={AgilLogo}
                  alt="AGIL"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-white">
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  SAGES • Société de Gestion &amp; Service
                </div>
                <h1 className="mt-1 text-2xl md:text-3xl font-extrabold">
                  Fiches Locataires
                </h1>
                <p className="mt-2 text-sm text-white/70 max-w-2xl leading-relaxed">
                  Gestion des informations de facturation et des contacts par
                  locataire / station.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 bg-white/5">
                    <FaIdCard /> {loading ? "…" : filtered.length} fiche(s)
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 bg-white/5">
                    ESC pour fermer le popup
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[360px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-white">
              <div className="text-sm font-extrabold">Conseil</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">
                Utilisez la recherche pour filtrer rapidement par{" "}
                <strong>locataire</strong>, <strong>station</strong> ou{" "}
                <strong>matricule</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* ACTION BAR */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-gray-900">
              Table des fiches
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? "Chargement…" : `${filtered.length} résultat(s)`} • Page{" "}
              {page}/{totalPages}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative w-full md:w-[340px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher… (locataire, station, matricule, tel)"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none
                focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm"
            >
              <FaPlus />
              Nouvelle fiche
            </button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
              <FaIdCard className="text-indigo-600" />
              Liste des fiches
            </div>

            {loading ? (
              <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                <FaSpinner className="animate-spin" /> Chargement
              </div>
            ) : (
              <div className="text-xs text-gray-500">✎ Modifier • 🗑️ Supprimer</div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[980px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Locataire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Station
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Matricule fiscale
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Téléphone
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-sm text-gray-500 border-b"
                      colSpan={6}
                    >
                      <div className="inline-flex items-center gap-2">
                        <FaSpinner className="animate-spin" />
                        Chargement…
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-sm text-gray-500" colSpan={6}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">📄</div>
                        <div className="text-base font-extrabold text-gray-900">
                          Aucune fiche
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Créez une fiche locataire pour enregistrer les
                          informations de facturation.
                        </div>
                        <button
                          onClick={openCreate}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                        >
                          <FaPlus /> Nouvelle fiche
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b hover:bg-indigo-50/50 transition"
                    >
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 flex items-center justify-center">
                            <FaUserTie />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-gray-900 truncate">
                              {dash(f.locataire?.nom)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {f.locataire_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <FaBuilding />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-gray-900 truncate">
                              {dash(f.station?.nom)}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {f.station_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-800">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold">
                          <FaIdCard />
                          {dash(f.matricule_fiscale)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-800">
                        {dash(f.contact)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-800">
                        <span className="inline-flex items-center gap-2">
                          <FaPhoneAlt className="text-gray-400" />
                          {dash(f.num_tel)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-800 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEdit(f)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-indigo-700 transition"
                          title="Modifier"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => remove(f.id)}
                          className="ml-2 inline-flex items-center justify-center w-10 h-10 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-4 border-t bg-white flex items-center justify-between text-xs text-gray-500">
              <div>
                Page{" "}
                <span className="font-semibold text-gray-900">{page}</span> /{" "}
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
          )}
        </div>
      </div>

      {/* MODAL */}
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
              "w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-transform duration-150",
              modalAnim ? "scale-100 translate-y-0" : "scale-[0.98] translate-y-2"
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <img
                    src={AgilLogo}
                    alt="AGIL"
                    className="w-5 h-5 object-contain"
                  />
                  AGIL • Fiche locataire
                </div>
                <h2 className="mt-1 text-lg md:text-xl font-extrabold text-gray-900">
                  {editingId ? "Modifier fiche" : "Nouvelle fiche"}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-gray-50 text-gray-700">
                    ESC pour fermer
                  </span>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center"
                title="Fermer (ESC)"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body (scroll inside modal) */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ✅ Locataire (Combobox) */}
                <ComboBox
                  label="Locataire *"
                  icon={<FaUserTie className="text-indigo-600" />}
                  value={form.locataire_id}
                  onChangeValue={(v) =>
                    setForm((f) => ({ ...f, locataire_id: v }))
                  }
                  options={locataireOptions}
                  placeholder="Rechercher un locataire..."
                  help="Tapez pour filtrer (nom / numéro)."
                />

                {/* ✅ Station (Combobox) */}
                <ComboBox
                  label="Station *"
                  icon={<FaBuilding className="text-emerald-600" />}
                  value={form.station_id}
                  onChangeValue={(v) =>
                    setForm((f) => ({ ...f, station_id: v }))
                  }
                  options={stationOptions}
                  placeholder="Rechercher une station..."
                  help="Tapez pour filtrer (nom / numéro)."
                />

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                    <FaIdCard className="text-indigo-600" /> Matricule fiscale *
                  </label>
                  <input
                    name="matricule_fiscale"
                    value={form.matricule_fiscale}
                    onChange={onChange}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-500" /> Adresse de
                    facturation
                  </label>
                  <input
                    name="adresse_facturation"
                    value={form.adresse_facturation}
                    onChange={onChange}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Contact
                  </label>
                  <input
                    name="contact"
                    value={form.contact}
                    onChange={onChange}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                    <FaPhoneAlt className="text-gray-500" /> Téléphone
                  </label>
                  <input
                    name="num_tel"
                    value={form.num_tel}
                    onChange={onChange}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-2">
                    <FaFax className="text-gray-500" /> Fax
                  </label>
                  <input
                    name="fax"
                    value={form.fax}
                    onChange={onChange}
                    className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 leading-relaxed">
                <strong>Note :</strong> Les fonctionnalités sont identiques.
                Design + UX du popup améliorés.
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white border-t px-5 py-4 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-semibold"
              >
                <FaTimes /> Annuler
              </button>
              <button
                onClick={save}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
              >
                <FaSave /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
