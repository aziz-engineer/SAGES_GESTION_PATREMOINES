import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaSpinner,
  FaFileInvoice,
  FaUserTie,
  FaBuilding,
  FaCalendarAlt,
  FaHashtag,
  FaReceipt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaObjectGroup,
  FaFilePdf,
  FaTrash,
  FaEdit,
  FaSave,
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AgilLogo from "../assets/Agil_Logo.gif";
import { API_BASE_URL } from "../apiConfig";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

const fmt3 = (n) => Number(n || 0).toFixed(3);
const cn = (...c) => c.filter(Boolean).join(" ");
const STATUS_OPTIONS = ["EMISE", "PAYEE", "IMPAYEE", "EN_RETARD", "ANNULEE", "REGROUPEE"];
const STATUS_META = {
  EMISE: {
    label: "Emise",
    tone: "indigo",
    chip: "border-indigo-200 bg-indigo-50 text-indigo-700",
    active: "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-200",
  },
  PAYEE: {
    label: "Payee",
    tone: "green",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    active: "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-200",
  },
  IMPAYEE: {
    label: "Impayee",
    tone: "slate",
    chip: "border-slate-200 bg-slate-100 text-slate-700",
    active: "border-slate-500 bg-slate-700 text-white shadow-lg shadow-slate-200",
  },
  EN_RETARD: {
    label: "En retard",
    tone: "amber",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    active: "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-200",
  },
  ANNULEE: {
    label: "Annulee",
    tone: "rose",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    active: "border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-200",
  },
  REGROUPEE: {
    label: "Regroupee",
    tone: "amber",
    chip: "border-orange-200 bg-orange-50 text-orange-700",
    active: "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-200",
  },
};
const statusLabel = (status) => STATUS_META[status]?.label || status || "Statut";

const Badge = ({ children, tone = "gray" }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-green-50 text-green-700 border-green-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
};

const statTone = (s) =>
  s === "PAYEE" ? "green" :
  s === "ANNULEE" ? "rose" :
  s === "REGROUPEE" ? "amber" :
  "indigo";

const numberToWordsFR = (n) => {
  const units = [
    "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
    "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf",
  ];
  const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

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

const formatFrenchDateLong = (d = new Date()) => {
  const months = [
    "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
    "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `Le ${day} ${month} ${year}`;
};

const buildBillingReferenceLine = (f) => {
  const objet = f?.contrat?.objet ? String(f.contrat.objet) : "—";
  const stationName = f?.station?.nom || "—";
  return `Référence de facturation : Contrat de Location et de Gestion d'espaces ${objet} dans la station services ${stationName}`;
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export default function Facture() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [q, setQ] = useState("");
  const [mois, setMois] = useState("");
  const [annee, setAnnee] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 12;

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loadingOne, setLoadingOne] = useState(false);
  const [modalAnim, setModalAnim] = useState(false);

  const [selectedFactures, setSelectedFactures] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [editingFacture, setEditingFacture] = useState(null);
  const [editingStatus, setEditingStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editModalAnim, setEditModalAnim] = useState(false);

  const canPrev = useMemo(() => meta?.current_page > 1, [meta]);
  const canNext = useMemo(() => meta?.current_page < meta?.last_page, [meta]);

  const fetchList = async (p = page) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await API.get("/factures", {
        params: {
          page: p,
          per_page: perPage,
          q: q || undefined,
          mois: mois || undefined,
          annee: annee || undefined,
          status: status || undefined,
        },
      });

      setRows(res.data.data);
      setMeta({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
        total: res.data.total,
        from: res.data.from,
        to: res.data.to,
      });
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur chargement factures.");
    }
    setLoading(false);
  };

  const openDetails = async (id) => {
    setOpen(true);
    setLoadingOne(true);
    setSelected(null);
    setErrorMsg("");

    try {
      const res = await API.get(`/factures/${id}`);
      setSelected(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur détail facture.");
      setOpen(false);
    }
    setLoadingOne(false);
  };

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    setPage(1);
    fetchList(1);
    setSelectedFactures([]);
  };

  const resetFilters = () => {
    setQ("");
    setMois("");
    setAnnee("");
    setStatus("");
    setPage(1);
    setSelectedFactures([]);
    fetchList(1);
  };

  const goPrev = () => {
    if (!canPrev) return;
    const p = page - 1;
    setPage(p);
    fetchList(p);
  };

  const goNext = () => {
    if (!canNext) return;
    const p = page + 1;
    setPage(p);
    fetchList(p);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!editOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeEditModal();
    };
    window.addEventListener("keydown", onKeyDown);

    setTimeout(() => setEditModalAnim(true), 10);

    return () => {
      document.body.style.overflow = prevOverflow || "";
      window.removeEventListener("keydown", onKeyDown);
      setEditModalAnim(false);
    };
  }, [editOpen]);

  const closeModal = () => {
    setModalAnim(false);
    setTimeout(() => setOpen(false), 160);
  };

  const toggleFactureSelection = (id) => {
    setSelectedFactures((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAllVisible = () => {
    const visibleIds = rows
      .filter((f) => !["REGROUPEE", "ANNULEE"].includes(f.status))
      .map((f) => f.id);

    const allSelected = visibleIds.every((id) => selectedFactures.includes(id));

    if (allSelected) {
      setSelectedFactures((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedFactures((prev) => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const generateGroupedPdf = async (f) => {
    if (!f) return;

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    try {
      const img = await loadImage(AgilLogo);
      const logoW = 22;
      const logoH = 22;
      doc.addImage(img, "PNG", (pageW - logoW) / 2, 10, logoW, logoH);
    } catch {}

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("Société AGIL de Gestion et de Services S.A «S.A.G.E.S»", pageW / 2, 40, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(10, 50, pageW - 10, 50);

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(`FACTURE REGROUPÉE N° : ${f.facture_code_full || f.facture_code || ""}`, 15, 60);
    doc.text(`DATE : ${formatFrenchDateLong(new Date())}`, pageW - 15, 60, { align: "right" });

    doc.setFont("times", "bold");
    doc.text("ENVOYÉ À", pageW - 15, 72, { align: "right" });
    doc.setFont("times", "normal");
    doc.text(f.locataire?.nom || "—", pageW - 15, 79, { align: "right" });
    doc.text(f.station?.nom || "—", pageW - 15, 85, { align: "right" });

    const referenceLine = buildBillingReferenceLine(f);

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(referenceLine, 15, 93, { maxWidth: pageW - 30 });
    doc.setTextColor(0, 0, 0);

    const rowsPdf = [];

    if (Number(f.loyer_fixe_ht) > 0) rowsPdf.push(["LOYER FIXE REGROUPÉ", "1", fmt3(f.loyer_fixe_ht), fmt3(f.loyer_fixe_ht)]);
    if (Number(f.redevance_htva) > 0) rowsPdf.push(["REDEVANCE REGROUPÉE", "1", fmt3(f.redevance_htva), fmt3(f.redevance_htva)]);
    if (Number(f.electricite_ht) > 0) rowsPdf.push(["ÉLECTRICITÉ REGROUPÉE", "1", fmt3(f.electricite_ht), fmt3(f.electricite_ht)]);
    if (Number(f.eau_ht) > 0) rowsPdf.push(["EAU REGROUPÉE", "1", fmt3(f.eau_ht), fmt3(f.eau_ht)]);
    if (Number(f.gaz_ht) > 0) rowsPdf.push(["GAZ REGROUPÉ", "1", fmt3(f.gaz_ht), fmt3(f.gaz_ht)]);
    if (Number(f.personnel_ht) > 0) rowsPdf.push(["PERSONNEL REGROUPÉ", "1", fmt3(f.personnel_ht), fmt3(f.personnel_ht)]);
    if (Number(f.charge_complementaire_ht) > 0) rowsPdf.push(["CHARGE COMPLÉMENTAIRE REGROUPÉE", "1", fmt3(f.charge_complementaire_ht), fmt3(f.charge_complementaire_ht)]);

    autoTable(doc, {
      startY: 100,
      head: [["DESCRIPTION", "QUANTITÉ", "PRIX UNITAIRE", "TOTAL"]],
      body: rowsPdf,
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

    const lastY = doc.lastAutoTable?.finalY || 150;
    const boxX = pageW - 15 - 60;
    let y = lastY + 6;

    const lineTotal = (label, value, bold = false) => {
      doc.setFont("times", bold ? "bold" : "normal");
      doc.text(label, boxX, y);
      doc.text(value, pageW - 15, y, { align: "right" });
      y += 6;
    };

    lineTotal("SOUS-TOTAL", fmt3(f.total_htva));
    lineTotal("TVA 19%", fmt3(f.tva_19));
    lineTotal("TIMBRES", fmt3(f.timber));
    doc.line(boxX, y, pageW - 15, y);
    y += 6;
    lineTotal("TOTAL", fmt3(f.total_ttc), true);

    const words = numberToWordsFR(Number(f.total_ttc || 0));
    const wordsY = Math.min(y + 8, pageH - 35);

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text("Arrêtée la présente facture à la somme de :", 15, wordsY);
    doc.setFont("times", "bold");
    doc.text(words.toUpperCase(), 15, wordsY + 6, { maxWidth: pageW - 30 });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(10, pageH - 25, pageW - 10, pageH - 25);

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text("RIB BANCAIRE : 03 000 010 0115 008740 73 (BNA AVENUE DE PARIS)", pageW / 2, pageH - 18, { align: "center" });

    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(
      "Société Anonyme au Capital de 1.500.000 Dinars — Siège Social : av. Mohamed Ali Akid, Cité Olympique, 1003 EL Khadra - Tunis",
      pageW / 2,
      pageH - 11,
      { align: "center", maxWidth: pageW - 20 }
    );
    doc.text("Tel : 71 703 322 — Fax : 71 704 333 — TVA : 000MP1400127/Z", pageW / 2, pageH - 7, { align: "center" });

    doc.save(`facture_regroupee_${f.facture_code || "group"}.pdf`);
  };

  const regrouperFactures = async () => {
    if (selectedFactures.length < 2) {
      toast.warning("Selectionnez au moins 2 factures.");
      return;
    }

    setGroupLoading(true);
    try {
      const res = await API.post("/factures/regrouper", {
        facture_ids: selectedFactures,
        date_facture: new Date().toISOString().slice(0, 10),
      });

      const factureRegroupee = res.data.facture;

      await generateGroupedPdf(factureRegroupee);

      setSelectedFactures([]);
      fetchList(page);

      toast.success("Facture regroupee creee avec succes.");
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
        "Erreur lors du regroupement des factures."
      );
    }
    setGroupLoading(false);
  };

  const openStatusModal = (facture) => {
    setEditingFacture(facture);
    setEditingStatus(facture.status || "EMISE");
    setEditOpen(true);
  };

  const closeEditModal = () => {
    setEditModalAnim(false);
    setTimeout(() => {
      setEditOpen(false);
      setEditingFacture(null);
      setEditingStatus("");
    }, 160);
  };

  const saveStatus = async () => {
    if (!editingStatus || !editingFacture?.id) return;

    setSavingStatus(true);
    setErrorMsg("");

    try {
      const res = await API.put(`/factures/${editingFacture.id}`, { status: editingStatus });
      const updatedFacture = res.data?.facture;

      setRows((prev) =>
        prev.map((item) =>
          item.id === editingFacture.id
            ? { ...item, status: updatedFacture?.status || editingStatus }
            : item
        )
      );

      setSelected((prev) =>
        prev && prev.id === editingFacture.id
          ? { ...prev, status: updatedFacture?.status || editingStatus }
          : prev
      );

      closeEditModal();
      toast.success("Statut de la facture modifie avec succes.");
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur modification statut.");
      toast.error(e?.response?.data?.message || "Erreur lors de la modification du statut.");
    }

    setSavingStatus(false);
  };

  const deleteFacture = async (facture) => {
    const confirmed = window.confirm(
      `Supprimer la facture ${facture.facture_code_full || facture.facture_code || facture.id} ?`
    );

    if (!confirmed) return;

    setDeletingId(facture.id);
    setErrorMsg("");

    try {
      await API.delete(`/factures/${facture.id}`);

      setRows((prev) => prev.filter((item) => item.id !== facture.id));
      setSelectedFactures((prev) => prev.filter((id) => id !== facture.id));

      if (selected?.id === facture.id) {
        closeModal();
        setSelected(null);
      }

      fetchList(page);
      toast.success("Facture supprimee avec succes.");
    } catch (e) {
      console.error(e);
      setErrorMsg("Erreur suppression facture.");
      toast.error(e?.response?.data?.message || "Erreur lors de la suppression de la facture.");
    }

    setDeletingId(null);
  };

  const allVisibleSelected =
    rows.filter((f) => !["REGROUPEE", "ANNULEE"].includes(f.status)).length > 0 &&
    rows
      .filter((f) => !["REGROUPEE", "ANNULEE"].includes(f.status))
      .every((f) => selectedFactures.includes(f.id));

  return (
    <div className="min-h-screen bg-gray-50">
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
                <img src={AgilLogo} alt="AGIL" className="w-full h-full object-contain" />
              </div>
              <div className="text-white">
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  SAGES • Société de Gestion &amp; Service
                </div>
                <h1 className="mt-1 text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                  <FaFileInvoice className="text-white/90" />
                  Rapport des Factures
                </h1>
                <p className="mt-2 text-sm text-white/70 max-w-2xl leading-relaxed">
                  Recherche, filtrage, sélection multiple et regroupement PDF.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 bg-white/5">
                    <FaReceipt />
                    {loading ? "…" : meta?.total ?? rows.length} facture(s)
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 bg-white/5">
                    Sélection : {selectedFactures.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[380px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-white">
              <div className="text-sm font-extrabold">Regroupement</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">
                Sélectionnez plusieurs factures du même locataire et de la même station, puis cliquez sur
                <strong> Regrouper et imprimer</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div>
              <div className="text-sm font-extrabold text-gray-900">Filtres</div>
              <div className="text-xs text-gray-500 mt-1">
                Affinez puis sélectionnez les factures à regrouper.
              </div>
            </div>

            {meta && (
              <div className="text-xs text-gray-500 md:text-right">
                <div className="font-semibold text-gray-900">
                  {meta.from ?? 0}-{meta.to ?? 0} / {meta.total ?? 0}
                </div>
                <div>Page {meta.current_page ?? 1}/{meta.last_page ?? 1}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Recherche
              </label>
              <div className="mt-1 flex items-center gap-2 border rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400">
                <FaSearch className="text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Code, locataire, station..."
                  className="w-full outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Mois</label>
              <input
                type="number"
                min="1"
                max="12"
                value={mois}
                onChange={(e) => setMois(e.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                placeholder="1..12"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Année</label>
              <input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(e.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                placeholder="2026"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              >
                <option value="">Tous</option>
                <option value="EMISE">EMISE</option>
                <option value="PAYEE">PAYEE</option>
                <option value="IMPAYEE">IMPAYEE</option>
                <option value="EN_RETARD">EN_RETARD</option>
                <option value="ANNULEE">ANNULEE</option>
                <option value="REGROUPEE">REGROUPEE</option>
              </select>
            </div>

            <div className="md:col-span-4 flex flex-wrap gap-2 mt-2">
              <button
                onClick={applyFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
              >
                <FaFilter />
                Appliquer
              </button>

              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
              >
                Réinitialiser
              </button>

              <button
                onClick={regrouperFactures}
                disabled={groupLoading || selectedFactures.length < 2}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold",
                  selectedFactures.length < 2
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                )}
              >
                {groupLoading ? <FaSpinner className="animate-spin" /> : <FaObjectGroup />}
                Regrouper et imprimer
              </button>

              {errorMsg && (
                <div className="ml-auto flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <FaExclamationTriangle />
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-gradient-to-b from-white to-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
              <FaReceipt className="text-indigo-600" />
              Liste des factures
            </div>

            {loading ? (
              <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                <FaSpinner className="animate-spin" /> Chargement
              </div>
            ) : (
              <div className="text-xs text-gray-500">
                Sélection multiple disponible
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1240px]">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 border-b">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Locataire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Station
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Mois/Année
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Total TTC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-500 border-b" colSpan={9}>
                      <div className="inline-flex items-center gap-2">
                        <FaSpinner className="animate-spin" />
                        Chargement…
                      </div>
                    </td>
                  </tr>
                  
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-sm text-gray-500" colSpan={9}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">📄</div>
                        <div className="text-base font-extrabold text-gray-900">
                          Aucune facture
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((f) => {
                    const disabled = ["REGROUPEE", "ANNULEE"].includes(f.status);

                    return (
                      <tr key={f.id} className="border-b hover:bg-indigo-50/50 transition">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedFactures.includes(f.id)}
                            disabled={disabled}
                            onChange={() => toggleFactureSelection(f.id)}
                          />
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 flex items-center justify-center">
                              <FaHashtag />
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-gray-900 truncate">
                                {f.facture_code_full || f.facture_code}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="inline-flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {f.date_facture}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="flex items-center gap-2">
                            <FaUserTie className="text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {f.locataire?.nom}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="flex items-center gap-2">
                            <FaBuilding className="text-gray-400" />
                            <span className="font-semibold text-gray-900">
                              {f.station?.nom}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-800">
                          {String(f.mois).padStart(2, "0")}/{f.annee}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-800">
                          <span className="font-extrabold text-gray-900">
                            {fmt3(f.total_ttc)} DT
                          </span>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-800">
                          <Badge tone={statTone(f.status)}>
                            {f.status === "PAYEE" ? (
                              <>
                                <FaCheckCircle /> PAYEE
                              </>
                            ) : (
                              f.status
                            )}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openDetails(f.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200"
                            >
                              <FaEye />
                              Voir
                            </button>

                            <button
                              onClick={() => openStatusModal(f)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
                            >
                              <FaEdit />
                              Modifier
                            </button>

                            <button
                              onClick={() => deleteFacture(f)}
                              disabled={deletingId === f.id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                            >
                              {deletingId === f.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                              Supprimer
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

          <div className="flex items-center justify-between px-5 py-4 border-t bg-white">
            <button
              onClick={goPrev}
              disabled={!canPrev}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold",
                canPrev
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              )}
            >
              <FaChevronLeft />
              Précédent
            </button>

            <div className="text-xs text-gray-500">
              Page {meta?.current_page || 1} / {meta?.last_page || 1}
            </div>

            <button
              onClick={goNext}
              disabled={!canNext}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold",
                canNext
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              )}
            >
              Suivant
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

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
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <img src={AgilLogo} alt="AGIL" className="w-5 h-5 object-contain" />
                  AGIL • Détail facture
                </div>
                <div className="mt-1 text-lg font-extrabold text-gray-900 truncate">
                  {selected?.facture_code_full || selected?.facture_code || "—"}
                </div>
              </div>

              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingOne ? (
                <div className="text-gray-500 inline-flex items-center gap-2">
                  <FaSpinner className="animate-spin" /> Chargement…
                </div>
              ) : !selected ? (
                <div className="text-gray-500">Aucune donnée.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                    <div className="border rounded-2xl p-4 bg-gray-50">
                      <div className="text-xs text-gray-500">Locataire</div>
                      <div className="mt-1 font-extrabold text-gray-900">
                        {selected.locataire?.nom}
                      </div>
                    </div>
                    <div className="border rounded-2xl p-4 bg-gray-50">
                      <div className="text-xs text-gray-500">Station</div>
                      <div className="mt-1 font-extrabold text-gray-900">
                        {selected.station?.nom}
                      </div>
                    </div>
                    <div className="border rounded-2xl p-4 bg-gray-50">
                      <div className="text-xs text-gray-500">Date</div>
                      <div className="mt-1 font-extrabold text-gray-900">
                        {selected.date_facture}
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                            Libellé
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 bg-gray-50 border-b">
                            Montant (DT)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.lignes || []).map((l) => (
                          <tr key={l.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-800 border-b">
                              {l.libelle}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800 border-b text-right font-semibold">
                              {fmt3(l.montant_htva)}
                            </td>
                          </tr>
                        ))}

                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b font-extrabold">
                            Total HTVA
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b text-right font-extrabold">
                            {fmt3(selected.total_htva)} DT
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b font-extrabold">
                            TVA 19%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b text-right font-extrabold">
                            {fmt3(selected.tva_19)} DT
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b font-extrabold">
                            Timber
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b text-right font-extrabold">
                            {fmt3(selected.timber)} DT
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm text-gray-900 font-extrabold">
                            Total TTC
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-extrabold">
                            {fmt3(selected.total_ttc)} DT
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-semibold"
              >
                <FaTimes /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div
          className={cn(
            "fixed inset-0 z-[10000] bg-slate-950/60 px-4 py-6 flex items-center justify-center transition-opacity duration-150",
            editModalAnim ? "opacity-100" : "opacity-0"
          )}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div
            className={cn(
              "w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-2xl transition-all duration-150",
              editModalAnim ? "scale-100 translate-y-0" : "scale-[0.98] translate-y-2"
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-900 to-emerald-800 px-6 py-6 text-white">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-emerald-300/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    Mise a jour du statut
                  </div>
                  <div className="mt-2 text-2xl font-extrabold tracking-tight">
                    {editingFacture?.facture_code_full || editingFacture?.facture_code || "Facture"}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold">
                      {editingFacture?.locataire?.nom || "Locataire"}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold">
                      {editingFacture?.station?.nom || "Station"}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold">
                      {editingFacture?.date_facture || "--"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={closeEditModal}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Statut actuel</div>
                  <div className="mt-3">
                    <Badge tone={statTone(editingFacture?.status)}>
                      {statusLabel(editingFacture?.status)}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total TTC</div>
                  <div className="mt-3 text-lg font-extrabold text-slate-900">
                    {fmt3(editingFacture?.total_ttc)} DT
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nouveau statut</div>
                  <div className="mt-3">
                    <Badge tone={STATUS_META[editingStatus]?.tone || "gray"}>
                      {statusLabel(editingStatus)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-900">Choisir un statut</div>
                <div className="mt-1 text-sm text-slate-500">
                  Selectionne le statut cible. La facture sera mise a jour immediatement apres validation.
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {STATUS_OPTIONS.map((item) => {
                    const isActive = editingStatus === item;
                    const meta = STATUS_META[item];

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setEditingStatus(item)}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          isActive
                            ? meta.active
                            : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-extrabold">{meta.label}</span>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                              isActive ? "border-white/20 bg-white/10 text-white" : meta.chip
                            )}
                          >
                            {item}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Facture {editingFacture?.facture_code_full || editingFacture?.facture_code || ""}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={closeEditModal}
                  disabled={savingStatus}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  <FaTimes />
                  Annuler
                </button>
                <button
                  onClick={saveStatus}
                  disabled={savingStatus}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {savingStatus ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
