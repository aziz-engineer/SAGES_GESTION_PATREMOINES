import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  FaUsers,
  FaMapMarkerAlt,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaEye,
  FaFilePdf,
  FaSearch,
  FaBuilding,
  FaIdBadge,
  FaSpinner,
} from "react-icons/fa";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from "../apiConfig";

// ✅ Branding AGIL
import AgilLogo from "../assets/Agil_Logo.gif";

// -------------------------------------------------------
// API CONFIG
// -------------------------------------------------------
const API = axios.create({
  baseURL: API_BASE_URL,
});

// -------------------------------------------------------
// HELPERS
// -------------------------------------------------------
const cn = (...c) => c.filter(Boolean).join(" ");

const Badge = ({ tone = "gray", children }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    green: "bg-green-50 text-green-700 border-green-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
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

const EmptyState = ({ title, subtitle }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center">
    <div className="text-sm font-extrabold text-gray-900">{title}</div>
    {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
  </div>
);

// ✅ Skeleton (pro)
const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="h-6 w-36 bg-gray-200 rounded-full" />
    </div>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-xl border bg-gray-50 p-3">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="mt-2 h-4 w-56 bg-gray-200 rounded" />
      </div>
      <div className="rounded-xl border bg-gray-50 p-3">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="mt-2 h-4 w-40 bg-gray-200 rounded" />
      </div>
      <div className="rounded-xl border bg-gray-50 p-3">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="mt-2 h-4 w-28 bg-gray-200 rounded" />
      </div>
      <div className="rounded-xl border bg-gray-50 p-3">
        <div className="h-3 w-10 bg-gray-200 rounded" />
        <div className="mt-2 h-4 w-24 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

// -------------------------------------------------------
// COMPONENT
// -------------------------------------------------------
export default function Test() {
  const [locataires, setLocataires] = useState([]);
  const [stations, setStations] = useState([]);

  const [loadingLoc, setLoadingLoc] = useState(true);
  const [loadingSta, setLoadingSta] = useState(true);

  const [showLocTable, setShowLocTable] = useState(true);
  const [showStaTable, setShowStaTable] = useState(false);

  // Search UI (frontend only)
  const [qLoc, setQLoc] = useState("");
  const [qSta, setQSta] = useState("");

  // simple pagination (frontend only)
  const [locPage, setLocPage] = useState(1);
  const [staPage, setStaPage] = useState(1);
  const perPage = 10;

  // POPUP
  const [showPopup, setShowPopup] = useState(false);
  const [selectedLocataire, setSelectedLocataire] = useState(null);
  const [fiches, setFiches] = useState([]);
  const [loadingFiches, setLoadingFiches] = useState(false);

  // ✅ animation state
  const [popupAnim, setPopupAnim] = useState(false);

  // PRINT PDF state
  const [printingPdf, setPrintingPdf] = useState(false);

  // --------------------------------------------------
  // BODY SCROLL LOCK + ESC CLOSE
  // --------------------------------------------------
  useEffect(() => {
    if (!showPopup) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKeyDown);

    // ✅ trigger animation after mount
    setTimeout(() => setPopupAnim(true), 10);

    return () => {
      document.body.style.overflow = prevOverflow || "";
      window.removeEventListener("keydown", onKeyDown);
      setPopupAnim(false);
    };
  }, [showPopup]);

  // --------------------------------------------------
  // FETCH DATA
  // --------------------------------------------------
  const fetchLocataires = async () => {
    try {
      const { data } = await API.get("/locataires");
      setLocataires(data);
    } catch (e) {
      console.error("Erreur locataires :", e);
    }
    setLoadingLoc(false);
  };

  const fetchStations = async () => {
    try {
      const { data } = await API.get("/stations");
      setStations(data);
    } catch (e) {
      console.error("Erreur stations :", e);
    }
    setLoadingSta(false);
  };

  useEffect(() => {
    fetchLocataires();
    fetchStations();
  }, []);

  // --------------------------------------------------
  // OPEN POPUP
  // --------------------------------------------------
  const openLocataireDetails = async (locataire) => {
    setSelectedLocataire(locataire);
    setShowPopup(true);
    setLoadingFiches(true);

    try {
      const { data } = await API.get(`/locataires/${locataire.id}/ficheloc`);
      setFiches(data);
    } catch (e) {
      console.error("Erreur fiches :", e);
      setFiches([]);
    }

    setLoadingFiches(false);
  };

  // ✅ close with animation
  const closePopup = () => {
    setPopupAnim(false);
    setTimeout(() => {
      setShowPopup(false);
    }, 160);
  };

  // --------------------------------------------------
  // GENERATE + PRINT PDF (FRONTEND ONLY)
  // --------------------------------------------------
  const handlePrintPdf = () => {
    if (!selectedLocataire) return;

    setPrintingPdf(true);

    try {
      const doc = new jsPDF("p", "mm", "a4");
      const now = new Date();
      const dateStr = now.toLocaleString("fr-FR");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Fiches - ${selectedLocataire.nom || ""}`, 14, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Locataire ID: ${selectedLocataire.id ?? "—"}`, 14, 22);
      doc.text(`Numéro: ${selectedLocataire.num ?? "—"}`, 14, 27);
      doc.text(`Date: ${dateStr}`, 14, 32);

      const columns = ["Station", "Matricule fiscale", "Adresse", "Contact", "Tél", "Fax"];

      const rows = (fiches || []).map((fiche) => [
        fiche?.station?.nom ?? "—",
        fiche?.matricule_fiscale ?? "—",
        fiche?.adresse_facturation ?? "—",
        fiche?.contact ?? "—",
        fiche?.num_tel ?? "—",
        fiche?.fax ?? "—",
      ]);

      if (rows.length === 0) {
        doc.setFontSize(11);
        doc.text("Aucune fiche trouvée.", 14, 45);
      } else {
        autoTable(doc, {
          head: [columns],
          body: rows,
          startY: 40,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [243, 244, 246], textColor: 20 },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 45 },
            3: { cellWidth: 30 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
          },
        });
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i}/${pageCount}`, 200, 290, { align: "right" });
      }

      const blobUrl = doc.output("bloburl");
      const printWindow = window.open(blobUrl);

      setTimeout(() => {
        try {
          if (!printWindow) return;
          printWindow.focus();
          printWindow.print();
        } catch (err) {
          console.warn("Auto print blocked, print manually.", err);
        }
      }, 600);
    } catch (e) {
      console.error("Erreur génération PDF :", e);
      alert("Erreur lors de la génération du PDF.");
    }

    setTimeout(() => setPrintingPdf(false), 700);
  };

  // --------------------------------------------------
  // FILTER + PAGINATION
  // --------------------------------------------------
  const filteredLocataires = useMemo(() => {
    const q = (qLoc || "").toLowerCase().trim();
    if (!q) return locataires;
    return locataires.filter((l) => {
      const nom = (l?.nom || "").toLowerCase();
      const num = String(l?.num ?? "").toLowerCase();
      return nom.includes(q) || num.includes(q);
    });
  }, [locataires, qLoc]);

  const filteredStations = useMemo(() => {
    const q = (qSta || "").toLowerCase().trim();
    if (!q) return stations;
    return stations.filter((s) => {
      const nom = (s?.nom || "").toLowerCase();
      const numero = String(s?.numero ?? "").toLowerCase();
      return nom.includes(q) || numero.includes(q);
    });
  }, [stations, qSta]);

  const locTotalPages = Math.max(1, Math.ceil(filteredLocataires.length / perPage));
  const staTotalPages = Math.max(1, Math.ceil(filteredStations.length / perPage));

  const locPageItems = useMemo(() => {
    const start = (locPage - 1) * perPage;
    return filteredLocataires.slice(start, start + perPage);
  }, [filteredLocataires, locPage]);

  const staPageItems = useMemo(() => {
    const start = (staPage - 1) * perPage;
    return filteredStations.slice(start, start + perPage);
  }, [filteredStations, staPage]);

  useEffect(() => setLocPage(1), [qLoc]);
  useEffect(() => setStaPage(1), [qSta]);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-rose-500 blur-3xl" />
        </div>

        <div className="relative border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-sm">
                <img src={AgilLogo} alt="AGIL" className="w-full h-full object-contain" />
              </div>
              <div className="text-white">
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                  SAGES • Société de Gestion &amp; Service
                </div>
                <h1 className="mt-1 text-2xl md:text-3xl font-extrabold">
                  Locataires &amp; Stations
                </h1>
                <p className="mt-2 text-sm text-white/70 max-w-2xl leading-relaxed">
                  Consultation rapide des locataires et stations, avec accès aux fiches et impression PDF.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="indigo">
                    <FaUsers /> {loadingLoc ? "…" : locataires.length} locataires
                  </Badge>
                  <Badge tone="green">
                    <FaMapMarkerAlt /> {loadingSta ? "…" : stations.length} stations
                  </Badge>
                </div>
              </div>
            </div>

            <div className="w-full md:w-[340px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 text-white">
              <div className="text-sm font-extrabold">Actions</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">
                • Cliquez sur un locataire pour voir ses fiches <br />
                • Impression PDF depuis la popup <br />
                • Fermer popup : touche <strong>ESC</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-1 space-y-4">
          <button
            type="button"
            onClick={() => {
              setShowLocTable(true);
              setShowStaTable(false);
            }}
            className={cn(
              "w-full rounded-2xl border shadow-sm p-5 text-left transition",
              showLocTable ? "bg-white border-indigo-200 shadow-md" : "bg-white border-gray-200 hover:shadow-md"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-2xl border flex items-center justify-center",
                    showLocTable ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-700"
                  )}
                >
                  <FaUsers />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-gray-900">Locataires</div>
                  <div className="text-xs text-gray-500">Liste & accès fiches</div>
                </div>
              </div>
              {showLocTable ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Badge tone="indigo">{loadingLoc ? "Chargement…" : `${filteredLocataires.length} éléments`}</Badge>
              <div className="text-xs text-gray-400">Cliquez pour ouvrir</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowStaTable(true);
              setShowLocTable(false);
            }}
            className={cn(
              "w-full rounded-2xl border shadow-sm p-5 text-left transition",
              showStaTable ? "bg-white border-green-200 shadow-md" : "bg-white border-gray-200 hover:shadow-md"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-2xl border flex items-center justify-center",
                    showStaTable ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-700"
                  )}
                >
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-gray-900">Stations</div>
                  <div className="text-xs text-gray-500">Liste des stations</div>
                </div>
              </div>
              {showStaTable ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Badge tone="green">{loadingSta ? "Chargement…" : `${filteredStations.length} éléments`}</Badge>
              <div className="text-xs text-gray-400">Cliquez pour ouvrir</div>
            </div>
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
            <div className="text-sm font-extrabold text-gray-900">Conseil</div>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Utilisez la recherche pour filtrer rapidement. Cliquez sur un locataire pour afficher ses fiches,
              puis imprimez en PDF depuis la popup.
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-6">
          {showLocTable && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b bg-gradient-to-b from-white to-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <FaUsers className="text-indigo-600" />
                    Liste des Locataires
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Cliquez sur une ligne pour ouvrir les fiches.
                  </div>
                </div>

                <div className="w-full md:w-[320px]">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={qLoc}
                      onChange={(e) => setQLoc(e.target.value)}
                      placeholder="Rechercher (nom ou numéro)…"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none
                      focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {loadingLoc ? (
                <div className="p-6 text-gray-500 flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Chargement…
                </div>
              ) : filteredLocataires.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="Aucun locataire" subtitle="Essayez de modifier votre recherche." />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Nom</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Numéro</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locPageItems.map((loc) => (
                          <tr
                            key={loc.id}
                            onClick={() => openLocataireDetails(loc)}
                            className="group cursor-pointer border-b hover:bg-indigo-50 transition"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white border border-indigo-100 text-indigo-700 flex items-center justify-center">
                                  <FaIdBadge />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 group-hover:text-indigo-800">{loc.nom}</div>
                                  <div className="text-xs text-gray-500">ID: {loc.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 font-semibold">{loc.num}</td>
                            <td className="px-4 py-3 text-right text-indigo-700">
                              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                                <FaEye /> Voir fiches
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 flex items-center justify-between text-xs text-gray-500 border-t bg-white">
                    <div>
                      Page <span className="font-semibold text-gray-900">{locPage}</span> /{" "}
                      <span className="font-semibold text-gray-900">{locTotalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLocPage((p) => Math.max(1, p - 1))}
                        disabled={locPage === 1}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-semibold transition",
                          locPage === 1
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                        )}
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setLocPage((p) => Math.min(locTotalPages, p + 1))}
                        disabled={locPage === locTotalPages}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-semibold transition",
                          locPage === locTotalPages
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
          )}

          {showStaTable && (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b bg-gradient-to-b from-white to-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-green-600" />
                    Liste des Stations
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Recherche rapide par nom ou numéro.
                  </div>
                </div>

                <div className="w-full md:w-[320px]">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={qSta}
                      onChange={(e) => setQSta(e.target.value)}
                      placeholder="Rechercher station…"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none
                      focus:border-green-400 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>
              </div>

              {loadingSta ? (
                <div className="p-6 text-gray-500 flex items-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Chargement…
                </div>
              ) : filteredStations.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="Aucune station" subtitle="Essayez de modifier votre recherche." />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Station</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Numéro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staPageItems.map((st) => (
                          <tr key={st.id} className="border-b hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white border border-green-100 text-green-700 flex items-center justify-center">
                                  <FaBuilding />
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{st.nom}</div>
                                  <div className="text-xs text-gray-500">ID: {st.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-700">{st.numero}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 flex items-center justify-between text-xs text-gray-500 border-t bg-white">
                    <div>
                      Page <span className="font-semibold text-gray-900">{staPage}</span> /{" "}
                      <span className="font-semibold text-gray-900">{staTotalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStaPage((p) => Math.max(1, p - 1))}
                        disabled={staPage === 1}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-semibold transition",
                          staPage === 1
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                        )}
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setStaPage((p) => Math.min(staTotalPages, p + 1))}
                        disabled={staPage === staTotalPages}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-semibold transition",
                          staPage === staTotalPages
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
          )}
        </div>
      </div>

      {/* ================= POPUP ================= */}
      {showPopup && (
        <div
          className={cn(
            "fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4 py-6 transition-opacity duration-150",
            popupAnim ? "opacity-100" : "opacity-0"
          )}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closePopup();
          }}
        >
          <div
            className={cn(
              "w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-transform duration-150",
              popupAnim ? "scale-100 translate-y-0" : "scale-[0.98] translate-y-2"
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* ✅ STICKY HEADER */}
            <div className="sticky top-0 z-10 p-5 border-b bg-white/95 backdrop-blur flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Détails locataire
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-gray-900 truncate">
                  Fiches — {selectedLocataire?.nom}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="indigo">
                    <FaUsers /> N° {selectedLocataire?.num ?? "—"}
                  </Badge>
                  <Badge tone="gray">
                    <FaIdBadge /> ID {selectedLocataire?.id ?? "—"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePrintPdf}
                  disabled={loadingFiches || printingPdf}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition",
                    loadingFiches || printingPdf
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white hover:bg-rose-50 text-rose-700 border-rose-200"
                  )}
                >
                  <FaFilePdf />
                  {printingPdf ? "Préparation..." : "Imprimer PDF"}
                </button>

                <button
                  onClick={closePopup}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
                  title="Fermer (ESC)"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* ✅ SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingFiches ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : fiches.length === 0 ? (
                <EmptyState title="Aucune fiche trouvée" subtitle="Ce locataire n’a pas encore de fiche." />
              ) : (
                <div className="space-y-3">
                  {fiches.map((fiche) => (
                    <div
                      key={fiche.id}
                      className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="font-extrabold text-gray-900">
                          {fiche.station?.nom ?? "Station —"}
                        </div>
                        <Badge tone="gray">
                          Matricule: {fiche.matricule_fiscale ?? "—"}
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border bg-gray-50 p-3">
                          <div className="text-xs text-gray-500 uppercase font-semibold">
                            Adresse
                          </div>
                          <div className="mt-1 font-semibold text-gray-900">
                            {fiche.adresse_facturation || "—"}
                          </div>
                        </div>

                        <div className="rounded-xl border bg-gray-50 p-3">
                          <div className="text-xs text-gray-500 uppercase font-semibold">
                            Contact
                          </div>
                          <div className="mt-1 font-semibold text-gray-900">
                            {fiche.contact || "—"}
                          </div>
                        </div>

                        <div className="rounded-xl border bg-gray-50 p-3">
                          <div className="text-xs text-gray-500 uppercase font-semibold">
                            Téléphone
                          </div>
                          <div className="mt-1 font-semibold text-gray-900">
                            {fiche.num_tel || "—"}
                          </div>
                        </div>

                        <div className="rounded-xl border bg-gray-50 p-3">
                          <div className="text-xs text-gray-500 uppercase font-semibold">
                            Fax
                          </div>
                          <div className="mt-1 font-semibold text-gray-900">
                            {fiche.fax || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-4 border-t bg-white text-xs text-gray-500 flex items-center justify-between">
              <div>SAGES • Société de Gestion &amp; Service</div>
              <div>{fiches?.length ?? 0} fiche(s)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
