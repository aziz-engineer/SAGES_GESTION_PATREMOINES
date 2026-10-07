import { Dialog, Listbox, Transition } from "@headlessui/react";
import { Fragment, forwardRef, useEffect, useMemo, useRef, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { fr } from "date-fns/locale/fr";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/datepicker.css";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Box,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  Download,
  Eye,
  Filter,
  Pencil,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axiosClient from "../axios";

registerLocale("fr", fr);

const defaultForm = {
  station_id: "",
  code_inventaire: "",
  designation: "",
  categorie: "",
  marque: "",
  modele: "",
  numero_serie: "",
  etat: "Bon",
  statut: "En service",
  date_acquisition: "",
  valeur_achat: "",
  fournisseur: "",
  garantie_fin: "",
  prochaine_maintenance: "",
  criticite: "Moyenne",
  responsable: "",
  notes: "",
};

const etatOptions = ["Excellent", "Bon", "Moyen", "Critique"];
const statutOptions = ["En service", "En maintenance", "En reserve", "Hors service"];
const criticiteOptions = ["Faible", "Moyenne", "Elevee", "Critique"];
const bonDeCommandePattern = /^\d+\/\d{4}$/;
const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100";

function shortDate(value) {
  if (!value) return "Non definie";
  return new Date(value).toLocaleDateString("fr-FR");
}

function toInputDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function buildPayload(form) {
  const { code_inventaire, ...rest } = form;
  return {
    ...rest,
    station_id: Number(form.station_id),
    valeur_achat: form.valeur_achat || null,
    date_acquisition: form.date_acquisition.trim() || null,
    garantie_fin: form.garantie_fin || null,
    prochaine_maintenance: form.prochaine_maintenance || null,
    marque: form.marque || null,
    modele: form.modele || null,
    numero_serie: form.numero_serie || null,
    fournisseur: form.fournisseur || null,
    responsable: form.responsable || null,
    notes: form.notes || null,
  };
}

function validateForm(form) {
  const errors = {};

  if (!form.station_id) errors.station_id = "Selectionnez une station.";
  if (!form.designation) errors.designation = "Selectionnez une famille.";
  if (!form.categorie) errors.categorie = "Selectionnez une sous-famille.";
  if (!form.marque.trim()) errors.marque = "Indiquez une designation.";
  if (!form.etat) errors.etat = "Selectionnez un etat.";
  if (!form.statut) errors.statut = "Selectionnez un statut.";
  if (!form.criticite) errors.criticite = "Selectionnez une criticite.";
  if (form.date_acquisition.trim() && !form.valeur_achat) {
    errors.valeur_achat = "Indiquez la date du bon de commande.";
  }
  if (!form.fournisseur.trim()) errors.fournisseur = "Indiquez un fournisseur.";
  if (!form.responsable.trim()) errors.responsable = "Indiquez une affectation.";

  return errors;
}

function exportCsv(items) {
  const headers = [
    "Code inventaire",
    "Designation",
    "Categorie",
    "Station",
    "Numero station",
    "Etat",
    "Statut",
    "Criticite",
    "Date de bon de commande",
    "Affectation",
    "Date affectation",
    "Prochaine maintenance",
  ];

  const rows = items.map((item) => [
    item.code_inventaire,
    item.designation,
    item.categorie,
    item.station?.nom || "",
    item.station?.numero || "",
    item.etat,
    item.statut,
    item.criticite,
    item.valeur_achat ?? "",
    item.responsable ?? "",
    item.garantie_fin ?? "",
    item.prochaine_maintenance ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "patrimoines.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildPatrimoinePdf(item) {
  const doc = new jsPDF("p", "mm", "a4");
  const generatedAt = new Date().toLocaleString("fr-FR");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Fiche Patrimoine", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Genere le ${generatedAt}`, 14, 24);
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(item.designation || "-", 14, 33);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Code inventaire : ${item.code_inventaire || "-"}`, 14, 39);

  const rows = [
    ["Famille", item.designation || "-"],
    ["Sous-famille", item.categorie || "-"],
    ["Station", item.station ? `${item.station.nom} (${item.station.numero})` : "-"],
    ["Designation", item.marque || "-"],
    ["Reference", item.modele || "-"],
    ["Numero de serie", item.numero_serie || "-"],
    ["Etat", item.etat || "-"],
    ["Statut", item.statut || "-"],
    ["Criticite", item.criticite || "-"],
    ["Date de bon de commande", shortDate(item.valeur_achat)],
    ["Fournisseur", item.fournisseur || "Non renseigne"],
    ["Bon de commande", item.date_acquisition || "Non renseigne"],
    ["Date affectation", shortDate(item.garantie_fin)],
    ["Prochaine maintenance", shortDate(item.prochaine_maintenance)],
    ["Affectation", item.responsable || "Non renseigne"],
  ];

  autoTable(doc, {
    body: rows,
    startY: 45,
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, fillColor: [243, 244, 246] },
      1: { cellWidth: 125 },
    },
    margin: { left: 14, right: 14 },
  });

  const notesY = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Notes", 14, notesY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(item.notes || "Aucune note ajoutee.", 182), 14, notesY + 6);

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Page ${i}/${pageCount}`, 196, 290, { align: "right" });
  }

  return doc;
}

function printPatrimoinePdf(item) {
  const doc = buildPatrimoinePdf(item);
  const blobUrl = doc.output("bloburl");
  const printWindow = window.open(blobUrl);

  setTimeout(() => {
    try {
      printWindow?.focus();
      printWindow?.print();
    } catch (error) {
      console.warn("Impression automatique bloquee, impression manuelle possible.", error);
    }
  }, 500);
}

function downloadPatrimoinePdf(item) {
  const doc = buildPatrimoinePdf(item);
  const filename = item.code_inventaire
    ? `patrimoine-${item.code_inventaire}.pdf`
    : `patrimoine-${item.id}.pdf`;

  doc.save(filename);
}

export default function Patrimoine() {
  const [stations, setStations] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [sousfams, setSousfams] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    in_service: 0,
    maintenance_due: 0,
    warranty_expiring: 0,
    critical_assets: 0,
  });
  const [filters, setFilters] = useState({
    q: "",
    station_id: "",
    etat: "",
    statut: "",
    criticite: "",
  });
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showOrderChoiceModal, setShowOrderChoiceModal] = useState(false);
  const dateAcquisitionRef = useRef(null);
  const notesRef = useRef(null);

  const fetchStations = async () => {
    try {
      const { data } = await axiosClient.get("/stations");
      setStations(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Impossible de charger les stations.");
    }
  };

  const fetchFamilles = async () => {
    try {
      const { data } = await axiosClient.get("/familles");
      setFamilles(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Impossible de charger les familles.");
    }
  };

  const fetchSousfams = async () => {
    try {
      const { data } = await axiosClient.get("/sousfams");
      setSousfams(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Impossible de charger les sous-familles.");
    }
  };

  const fetchPatrimoines = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "")
      );
      const { data } = await axiosClient.get("/patrimoines", { params });
      setItems(data.data || []);
      setStats(data.stats || {});
    } catch (error) {
      toast.error(error?.response?.data?.message || "Erreur de chargement des patrimoines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    fetchFamilles();
    fetchSousfams();
  }, []);

  useEffect(() => {
    fetchPatrimoines();
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const alerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in60 = new Date(today);
    in60.setDate(in60.getDate() + 60);

    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);

    return items.filter((item) => {
      const warranty = item.garantie_fin ? new Date(item.garantie_fin) : null;
      const maintenance = item.prochaine_maintenance ? new Date(item.prochaine_maintenance) : null;

      return (
        item.criticite === "Critique" ||
        (warranty && warranty >= today && warranty <= in60) ||
        (maintenance && maintenance <= in30)
      );
    });
  }, [items]);

  const topStations = useMemo(() => {
    return [...stations]
      .sort((a, b) => (b.patrimoines_count || 0) - (a.patrimoines_count || 0))
      .slice(0, 3);
  }, [stations]);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "designation" ? { categorie: "" } : {}),
    }));
    setErrors((current) => {
      if (!current[name] && !(name === "designation" && current.categorie)) return current;
      const next = { ...current };
      delete next[name];
      if (name === "designation") delete next.categorie;
      return next;
    });
  };

  const handleFilterChange = ({ target: { name, value } }) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setFormOpen(true);
  };

  const closeFormModal = () => {
    if (submitting) return;
    setFormOpen(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Merci de corriger les champs indiques en rouge.");
      return;
    }
    setErrors({});

    const bonDeCommande = form.date_acquisition.trim();

    if (bonDeCommande && !bonDeCommandePattern.test(bonDeCommande)) {
      toast.error("Le bon de commande doit etre au format numero/annee, ex: 122/2023.");
      return;
    }

    if (!bonDeCommande && !form.notes.trim()) {
      setShowOrderChoiceModal(true);
      return;
    }

    setSubmitting(true);

    try {
      const payload = buildPayload(form);

      if (editingId) {
        await axiosClient.put(`/patrimoines/${editingId}`, payload);
        toast.success("Patrimoine mis a jour avec succes.");
      } else {
        await axiosClient.post("/patrimoines", payload);
        toast.success("Patrimoine ajoute avec succes.");
      }

      closeFormModal();
      fetchPatrimoines();
      fetchStations();
    } catch (error) {
      const apiErrors = error?.response?.data?.errors;
      const firstError = apiErrors
        ? Object.values(apiErrors).flat()[0]
        : error?.response?.data?.message;
      toast.error(firstError || "Impossible d'enregistrer le patrimoine.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      station_id: String(item.station_id ?? ""),
      code_inventaire: item.code_inventaire ?? "",
      designation: item.designation ?? "",
      categorie: item.categorie ?? "",
      marque: item.marque ?? "",
      modele: item.modele ?? "",
      numero_serie: item.numero_serie ?? "",
      etat: item.etat ?? "Bon",
      statut: item.statut ?? "En service",
      date_acquisition: item.date_acquisition ?? "",
      valeur_achat: toInputDate(item.valeur_achat),
      fournisseur: item.fournisseur ?? "",
      garantie_fin: toInputDate(item.garantie_fin),
      prochaine_maintenance: toInputDate(item.prochaine_maintenance),
      criticite: item.criticite ?? "Moyenne",
      responsable: item.responsable ?? "",
      notes: item.notes ?? "",
    });
    setFormOpen(true);
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;

    try {
      await axiosClient.delete(`/patrimoines/${deleteTarget.id}`);
      toast.success("Patrimoine supprime.");

      if (editingId === deleteTarget.id) {
        resetForm();
      }

      setDeleteTarget(null);
      setDetailsItem((current) =>
        current?.id === deleteTarget.id ? null : current
      );
      fetchPatrimoines();
      fetchStations();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Suppression impossible.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.75)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.35fr_0.65fr] lg:px-10 lg:py-10">
            <div className="relative">
              <div className="absolute -left-10 top-0 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                  <Sparkles size={14} />
                  Asset Control Center
                </div>
                <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Patrimoine station par station
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Centralisez les materiels, suivez les urgences, preparez vos revues manager et gerez les equipements avec des interactions plus propres grace aux popups.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                  >
                    <Plus size={18} />
                    Nouveau patrimoine
                  </button>
                  <button
                    type="button"
                    onClick={() => exportCsv(items)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    <ArrowUpRight size={18} />
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
                      Vue manager
                    </div>
                    <div className="mt-2 text-4xl font-black text-white">
                      {stats.total || 0}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      actifs inventories
                    </div>
                  </div>
                  <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200">
                    <ClipboardList size={22} />
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Stations les plus equipees
                </div>
                <div className="mt-4 space-y-3">
                  {topStations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-slate-400">
                      Aucune station disponible.
                    </div>
                  ) : (
                    topStations.map((station, index) => (
                      <div
                        key={station.id}
                        className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-bold text-white">
                            {index + 1}. {station.nom}
                          </div>
                          <div className="text-xs text-slate-400">
                            Station {station.numero}
                          </div>
                        </div>
                        <div className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-200">
                          {station.patrimoines_count || 0} actifs
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Box} label="En service" value={stats.in_service || 0} tone="cyan" />
          <StatCard icon={Wrench} label="Maintenance proche" value={stats.maintenance_due || 0} tone="amber" />
          <StatCard icon={ShieldAlert} label="Affectations a suivre" value={stats.warranty_expiring || 0} tone="blue" />
          <StatCard icon={AlertTriangle} label="Materiels critiques" value={stats.critical_assets || 0} tone="rose" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-700">
                    Filtrage intelligent
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Recherche et tri
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                  <Filter size={14} />
                  {items.length} resultat(s)
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
                      placeholder="Code, materiel, categorie, station..."
                      className="w-full border-0 bg-transparent p-0 text-sm text-slate-800 outline-none"
                    />
                  </div>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Station"
                    name="station_id"
                    value={filters.station_id}
                    onChange={handleFilterChange}
                    placeholder="Toutes"
                    options={stations.map((station) => ({ value: String(station.id), label: station.nom }))}
                  />

                  <SelectField
                    label="Statut"
                    name="statut"
                    value={filters.statut}
                    onChange={handleFilterChange}
                    placeholder="Tous"
                    options={statutOptions.map((option) => ({ value: option, label: option }))}
                  />

                  <SelectField
                    label="Etat"
                    name="etat"
                    value={filters.etat}
                    onChange={handleFilterChange}
                    placeholder="Tous"
                    options={etatOptions.map((option) => ({ value: option, label: option }))}
                  />

                  <SelectField
                    label="Criticite"
                    name="criticite"
                    value={filters.criticite}
                    onChange={handleFilterChange}
                    placeholder="Toutes"
                    options={criticiteOptions.map((option) => ({ value: option, label: option }))}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => exportCsv(items)}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters({ q: "", station_id: "", etat: "", statut: "", criticite: "" })}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Effacer filtres
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
                    Alertes operationnelles
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Suivi prioritaire
                  </h2>
                </div>
                <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700">
                  {alerts.length} alerte(s)
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {alerts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Aucune alerte critique pour le moment.
                  </div>
                ) : (
                  alerts.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDetailsItem(item)}
                      className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left transition hover:border-amber-300 hover:bg-amber-100/60"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{item.designation}</div>
                          <div className="text-sm text-slate-600">
                            {item.station?.nom || "Sans station"} • {item.code_inventaire}
                          </div>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700">
                          {item.criticite}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-700">
                        Affectation: {shortDate(item.garantie_fin)} • Maintenance: {shortDate(item.prochaine_maintenance)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                    Registre central
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Patrimoines
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Cliquez pour ouvrir les details ou utilisez les actions rapides.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
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
                    {["Materiel", "Station", "Etat", "Date BC", "Suivi", "Actions"].map((header) => (
                      <th
                        key={header}
                        className={`px-4 py-3 font-bold uppercase tracking-wider text-slate-500 ${
                          header === "Actions" ? "text-right" : "text-left"
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                        Chargement des patrimoines...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-12">
                        <div className="mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                            <Box size={24} />
                          </div>
                          <div className="mt-4 text-lg font-bold text-slate-900">
                            Aucun patrimoine trouve
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            Commencez par ajouter un materiel pour construire votre registre.
                          </p>
                          <button
                            type="button"
                            onClick={openCreateModal}
                            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
                          >
                            <Plus size={16} />
                            Ajouter un patrimoine
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="group hover:bg-cyan-50/40">
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => setDetailsItem(item)}
                            className="text-left"
                          >
                            <div className="font-bold text-slate-900 transition group-hover:text-cyan-800">
                              {item.designation}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.code_inventaire} • {item.categorie}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800">{item.station?.nom || "-"}</div>
                          <div className="text-xs text-slate-500">Station {item.station?.numero || ""}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-2">
                            <Badge tone={item.etat === "Critique" ? "rose" : item.etat === "Moyen" ? "amber" : "emerald"}>
                              {item.etat}
                            </Badge>
                            <Badge tone={item.statut === "En service" ? "cyan" : item.statut === "Hors service" ? "rose" : "slate"}>
                              {item.statut}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">
                          {shortDate(item.valeur_achat)}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          <div>Affectation: {shortDate(item.garantie_fin)}</div>
                          <div className="mt-1">Maintenance: {shortDate(item.prochaine_maintenance)}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Voir"
                              onClick={() => setDetailsItem(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              title="Modifier"
                              onClick={() => startEdit(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              title="Telecharger PDF"
                              onClick={() => downloadPatrimoinePdf(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              type="button"
                              title="Supprimer"
                              onClick={() => setDeleteTarget(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {items.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
                <div className="text-xs font-semibold text-slate-500">
                  Page {currentPage} sur {totalPages} • {items.length} resultat(s)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                  >
                    Precedent
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <PatrimoineFormModal
        form={form}
        errors={errors}
        formOpen={formOpen}
        stations={stations}
        familles={familles}
        sousfams={sousfams}
        editingId={editingId}
        submitting={submitting}
        onClose={closeFormModal}
        onChange={handleChange}
        onSubmit={handleSubmit}
        dateAcquisitionRef={dateAcquisitionRef}
        notesRef={notesRef}
        showOrderChoiceModal={showOrderChoiceModal}
        onCloseOrderChoiceModal={() => setShowOrderChoiceModal(false)}
        onChooseOrder={() => {
          setShowOrderChoiceModal(false);
          dateAcquisitionRef.current?.focus();
        }}
        onChooseNotes={() => {
          setShowOrderChoiceModal(false);
          notesRef.current?.focus();
        }}
      />

      <PatrimoineDetailsModal
        item={detailsItem}
        onClose={() => setDetailsItem(null)}
      />

      <ConfirmDeleteModal
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteItem}
      />
    </div>
  );
}

function PatrimoineFormModal({
  form,
  errors,
  formOpen,
  stations,
  familles,
  sousfams,
  editingId,
  submitting,
  onClose,
  onChange,
  onSubmit,
  dateAcquisitionRef,
  notesRef,
  showOrderChoiceModal,
  onCloseOrderChoiceModal,
  onChooseOrder,
  onChooseNotes,
}) {
  const selectedFamille = familles.find((famille) => famille.nom === form.designation);
  const filteredSousfams = selectedFamille
    ? sousfams.filter((sousfam) => sousfam.famille_id === selectedFamille.id)
    : [];

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
              <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
                <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#164e63_100%)] px-6 py-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">
                        Gestion patrimoine
                      </div>
                      <Dialog.Title className="mt-2 text-2xl font-black">
                        {editingId ? "Modifier un patrimoine" : "Ajouter un patrimoine"}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-300">
                        Formulaire professionnel avec saisie centralisee par station.
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

                <form onSubmit={onSubmit} noValidate className="max-h-[78vh] overflow-y-auto px-6 py-6">
                  <div className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        label="Station"
                        name="station_id"
                        value={form.station_id}
                        onChange={onChange}
                        placeholder="Choisir une station"
                        required
                        error={errors.station_id}
                        options={stations.map((station) => ({
                          value: String(station.id),
                          label: `${station.nom} (${station.numero})`,
                        }))}
                      />
                      <Field label="Code inventaire">
                        <input
                          value={editingId ? form.code_inventaire : "Genere automatiquement (XX-YYY-ZZZZ-WWW)"}
                          readOnly
                          disabled
                          className={`${fieldClassName} cursor-not-allowed bg-slate-100 text-slate-500`}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <SelectField
                        label="FAMILLE"
                        name="designation"
                        value={form.designation}
                        onChange={onChange}
                        placeholder="Choisir une famille"
                        required
                        error={errors.designation}
                        options={familles.map((famille) => ({
                          value: famille.nom,
                          label: `${famille.nom} (${famille.numero})`,
                        }))}
                      />
                      <SelectField
                        label="SousFamille"
                        name="categorie"
                        value={form.categorie}
                        onChange={onChange}
                        disabled={!selectedFamille}
                        required
                        error={errors.categorie}
                        placeholder={selectedFamille ? "Choisir une sous-famille" : "Choisir d'abord une famille"}
                        options={filteredSousfams.map((sousfam) => ({
                          value: sousfam.nom,
                          label: `${sousfam.nom} (${sousfam.numero})`,
                        }))}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Designation" error={errors.marque}>
                        <input name="marque" value={form.marque} onChange={onChange} className={fieldClassName} required />
                      </Field>
                      <Field label="Reference">
                        <input name="modele" value={form.modele} onChange={onChange} className={fieldClassName} />
                      </Field>
                      <Field label="Numero serie">
                        <input name="numero_serie" value={form.numero_serie} onChange={onChange} className={fieldClassName} />
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <SelectField
                        label="Etat"
                        name="etat"
                        value={form.etat}
                        onChange={onChange}
                        required
                        error={errors.etat}
                        options={etatOptions.map((option) => ({ value: option, label: option }))}
                      />
                      <SelectField
                        label="Statut"
                        name="statut"
                        value={form.statut}
                        onChange={onChange}
                        required
                        error={errors.statut}
                        options={statutOptions.map((option) => ({ value: option, label: option }))}
                      />
                      <SelectField
                        label="Criticite"
                        name="criticite"
                        value={form.criticite}
                        onChange={onChange}
                        required
                        error={errors.criticite}
                        options={criticiteOptions.map((option) => ({ value: option, label: option }))}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Bon de commande">
                        <input
                          ref={dateAcquisitionRef}
                          type="text"
                          name="date_acquisition"
                          value={form.date_acquisition}
                          onChange={onChange}
                          placeholder="Ex: 34/2023"
                          autoComplete="off"
                          className={fieldClassName}
                        />
                      </Field>
                      <DateField
                        label="Date de bon de commande"
                        name="valeur_achat"
                        value={form.valeur_achat}
                        onChange={onChange}
                        required={Boolean(form.date_acquisition.trim())}
                        error={errors.valeur_achat}
                      />
                      <Field label="Fournisseur" error={errors.fournisseur}>
                        <input name="fournisseur" value={form.fournisseur} onChange={onChange} className={fieldClassName} required />
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <DateField
                        label="Date affectation"
                        name="garantie_fin"
                        value={form.garantie_fin}
                        onChange={onChange}
                      />
                      <DateField
                        label="Prochaine maintenance"
                        name="prochaine_maintenance"
                        value={form.prochaine_maintenance}
                        onChange={onChange}
                      />
                      <Field label="Affectation" error={errors.responsable}>
                        <input name="responsable" value={form.responsable} onChange={onChange} className={fieldClassName} required />
                      </Field>
                    </div>

                    <Field label="Notes">
                      <textarea
                        ref={notesRef}
                        name="notes"
                        value={form.notes}
                        onChange={onChange}
                        rows="4"
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
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus size={16} />
                      {submitting ? "Enregistrement..." : editingId ? "Mettre a jour" : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        <OrderOrNotesModal
          open={showOrderChoiceModal}
          onClose={onCloseOrderChoiceModal}
          onChooseOrder={onChooseOrder}
          onChooseNotes={onChooseNotes}
        />
      </Dialog>
    </Transition>
  );
}

function PatrimoineDetailsModal({ item, onClose }) {
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
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
                {item && (
                  <>
                    <div className="border-b border-slate-200 bg-slate-950 px-6 py-5 text-white">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-200">
                            Fiche patrimoine
                          </div>
                          <Dialog.Title className="mt-2 text-2xl font-black">
                            {item.designation}
                          </Dialog.Title>
                          <p className="mt-1 text-sm text-slate-300">
                            {item.code_inventaire} • {item.categorie}
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
                        <InfoCard label="Station" value={`${item.station?.nom || "-"} (${item.station?.numero || "-"})`} />
                        <InfoCard label="Affectation" value={item.responsable || "Non renseigne"} />
                        <InfoCard label="Designation / Reference" value={`${item.marque || "-"} / ${item.modele || "-"}`} />
                        <InfoCard label="Numero serie" value={item.numero_serie || "Non renseigne"} />
                        <InfoCard label="Date de bon de commande" value={shortDate(item.valeur_achat)} />
                        <InfoCard label="Fournisseur" value={item.fournisseur || "Non renseigne"} />
                        <InfoCard label="Bon de commande" value={item.date_acquisition || "Non renseigne"} />
                        <InfoCard label="Date affectation" value={shortDate(item.garantie_fin)} />
                        <InfoCard label="Prochaine maintenance" value={shortDate(item.prochaine_maintenance)} />
                        <InfoCard label="Criticite" value={item.criticite} />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Etat
                          </div>
                          <div className="mt-2">
                            <Badge tone={item.etat === "Critique" ? "rose" : item.etat === "Moyen" ? "amber" : "emerald"}>
                              {item.etat}
                            </Badge>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Statut
                          </div>
                          <div className="mt-2">
                            <Badge tone={item.statut === "En service" ? "cyan" : item.statut === "Hors service" ? "rose" : "slate"}>
                              {item.statut}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Notes
                        </div>
                        <div className="mt-2 text-sm leading-7 text-slate-700">
                          {item.notes || "Aucune note ajoutee."}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => printPatrimoinePdf(item)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
                        >
                          <Printer size={16} />
                          Imprimer PDF
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
                    Supprimer ce patrimoine ?
                  </Dialog.Title>
                  <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                    {item ? `Vous allez supprimer ${item.designation}. Cette action est definitive.` : ""}
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

function OrderOrNotesModal({ open, onClose, onChooseOrder, onChooseNotes }) {
  return (
    <Transition appear show={open} as={Fragment}>
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
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                    <AlertTriangle size={22} />
                  </div>
                  <Dialog.Title className="mt-4 text-center text-xl font-black text-slate-900">
                    Bon de commande manquant
                  </Dialog.Title>
                  <p className="mt-2 text-center text-sm leading-6 text-slate-500">
                    Le champ "Bon de commande" est vide. Renseignez-le, ou remplissez les Notes pour justifier son absence.
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={onChooseOrder}
                      className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-700"
                    >
                      Renseigner le bon de commande
                    </button>
                    <button
                      type="button"
                      onClick={onChooseNotes}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Remplir les notes a la place
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

function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="absolute left-0 top-full z-20 mt-2 w-max max-w-xs">
      <div className="absolute -top-[5px] left-4 h-2.5 w-2.5 rotate-45 border-l border-t border-rose-200 bg-white" />
      <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 shadow-lg shadow-rose-900/10">
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
          <AlertCircle size={11} strokeWidth={3} />
        </span>
        <span className="text-xs font-semibold leading-5 text-rose-700">{message}</span>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className={`relative mt-1 rounded-2xl ${error ? "ring-2 ring-rose-300" : ""}`}>
        {children}
        <FieldError message={error} />
      </div>
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Selectionner",
  disabled = false,
  required = false,
  error,
}) {
  const currentValue = value ?? "";
  const selectedOption = options.find((option) => String(option.value) === String(currentValue));

  return (
    <Listbox
      value={currentValue}
      onChange={(nextValue) => onChange({ target: { name, value: nextValue } })}
      disabled={disabled}
    >
      {({ open }) => (
        <div className="block">
          {label && (
            <Listbox.Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {label}
            </Listbox.Label>
          )}
          <div className={`relative ${label ? "mt-1" : ""}`}>
            <Listbox.Button
              className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-sm outline-none transition ${
                disabled
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : error
                  ? "border-rose-300 bg-white text-slate-800 ring-4 ring-rose-100"
                  : open
                  ? "border-cyan-400 bg-white text-slate-800 ring-4 ring-cyan-100"
                  : "border-slate-200 bg-white text-slate-800 hover:border-cyan-300"
              }`}
            >
              <span className={`truncate ${selectedOption ? "font-semibold text-slate-800" : "text-slate-400"}`}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                  open ? "rotate-180 text-cyan-600" : ""
                }`}
              />
            </Listbox.Button>

            <FieldError message={error} />

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 outline-none">
                {options.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-slate-400">Aucune option disponible</div>
                ) : (
                  options.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active, selected }) =>
                        `flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
                          active ? "bg-cyan-50 text-cyan-800" : "text-slate-700"
                        } ${selected ? "font-semibold text-cyan-800" : ""}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="truncate">{option.label}</span>
                          {selected && <Check size={16} className="shrink-0 text-cyan-600" />}
                        </>
                      )}
                    </Listbox.Option>
                  ))
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </div>
      )}
    </Listbox>
  );
}

function parseYMD(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatYMD(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DateTrigger = forwardRef(function DateTrigger({ value, onClick, onClear, error }, ref) {
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left outline-none transition ${
        error
          ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
          : "border-slate-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 hover:border-cyan-300"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition group-hover:bg-cyan-100">
        <Calendar size={16} />
      </span>
      <span className={`flex-1 truncate text-sm ${value ? "font-semibold text-slate-800" : "text-slate-400"}`}>
        {value || "jj/mm/aaaa"}
      </span>
      {onClear && (
        <span
          role="button"
          tabIndex={0}
          onClick={onClear}
          title="Effacer la date"
          className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
        >
          <X size={14} />
        </span>
      )}
    </button>
  );
});

function DateField({ label, name, value, onChange, required = false, min, max, error }) {
  const pickerRef = useRef(null);
  const selectedDate = parseYMD(value);

  const emit = (date) => {
    onChange({ target: { name, value: formatYMD(date) } });
  };

  const clearValue = (event) => {
    event.stopPropagation();
    emit(null);
    pickerRef.current?.setOpen(false);
  };

  return (
    <label className="block">
      {label && <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>}
      <div className="relative mt-1">
        <DatePicker
          ref={pickerRef}
          selected={selectedDate}
          onChange={emit}
          locale="fr"
          dateFormat="dd/MM/yyyy"
          minDate={parseYMD(min)}
          maxDate={parseYMD(max)}
          popperClassName="patrimoine-datepicker-popper"
          calendarClassName="patrimoine-datepicker"
          popperPlacement="bottom-start"
          popperProps={{ strategy: "fixed" }}
          showPopperArrow={false}
          customInput={<DateTrigger onClear={value ? clearValue : undefined} error={error} />}
        >
          <div className="patrimoine-datepicker-footer">
            <button
              type="button"
              onClick={() => {
                emit(null);
                pickerRef.current?.setOpen(false);
              }}
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => {
                emit(new Date());
                pickerRef.current?.setOpen(false);
              }}
            >
              Aujourd&apos;hui
            </button>
          </div>
        </DatePicker>

        <FieldError message={error} />
      </div>
    </label>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  const tones = {
    cyan: "from-cyan-500/15 to-sky-500/10",
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
    cyan: "bg-cyan-50 text-cyan-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
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
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}
