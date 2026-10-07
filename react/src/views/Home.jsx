import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LockClosedIcon,
  ArrowUpOnSquareIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  KeyIcon,
} from "@heroicons/react/20/solid";

import { toast } from "react-toastify";

// ✅ Branding (AGIL)
// Place le fichier ici: src/assets/Agil_Logo.gif
import AgilLogo from "../assets/Agil_Logo.gif";

// ✅ Image (inchangée)
import connexion from "../assets/images/connexion.jpg";
import { API_BASE_URL } from "../apiConfig";

const Home = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [numTelephone, setNumTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState("Choisir un fichier");
  const [error, setError] = useState({ __html: "" });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/user-profile`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("TOKEN")}`,
            },
          }
        );
        const userData = response.data.user;
        setName(userData.name);
        setEmail(userData.email);
        setNumTelephone(userData.numtelephone || "");
        setAdresse(userData.adresse || "");
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError({ __html: "" });

    const formData = new FormData();
    if (name) formData.append("name", name);
    if (email) formData.append("email", email);
    if (password) formData.append("password", password);
    if (passwordConfirmation)
      formData.append("password_confirmation", passwordConfirmation);
    if (numTelephone) formData.append("numtelephone", numTelephone);
    if (adresse) formData.append("adresse", adresse);
    if (image) {
      formData.append("imageduprofile", image);
    }

    try {
      const response = await axios.post(
          `${API_BASE_URL}/update-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("TOKEN")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Profile updated:", response.data);
      toast.success("Profil mis à jour avec succès.");
    } catch (error) {
      if (error.response) {
        const finalErrors = Object.values(error.response.data.errors).reduce(
          (accum, next) => [...accum, ...next],
          []
        );
        setError({ __html: finalErrors.join("<br>") });
      }
      console.error("Error updating profile:", error?.response?.data || error);
      toast.error("Une erreur est survenue.");
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "imageduprofile") {
      setImage(files?.[0] || null);
      setImageName(files?.[0]?.name || "Choisir un fichier");
      return;
    }

    if (name === "numtelephone") setNumTelephone(value);
    else if (name === "adresse") setAdresse(value);
    else if (name === "name") setName(value);
    else if (name === "email") setEmail(value);
    else if (name === "password") setPassword(value);
    else if (name === "password_confirmation") setPasswordConfirmation(value);
  };

  const handleFileClick = () => {
    document.getElementById("imageduprofile")?.click();
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        {/* ✅ AGIL Top Brand Bar (no diggow) */}
        <div className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white border shadow-sm p-2">
                <img
                  src={AgilLogo}
                  alt="AGIL"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">
                  Société AGIL de Gestion &amp; Service
                </div>
                <div className="text-xs text-slate-500">
                  SAGES • Gestion des locataires • Profil utilisateur
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-slate-50 text-slate-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.15)]" />
                Espace interne
              </span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left visual / info */}
            <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90" />
              
              <div className="relative p-8 lg:p-10 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Paramètres du compte
                </div>

                <h1 className="mt-4 text-3xl font-extrabold leading-tight">
                  Mise à jour du profil
                </h1>
                <p className="mt-3 text-sm text-white/75 max-w-md leading-relaxed">
                  Modifiez vos informations personnelles, votre mot de passe et
                  votre photo de profil. Les données sont enregistrées via l’API
                  sécurisée.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <div className="text-xs text-white/70">Sécurité</div>
                    <div className="mt-1 font-bold">Accès protégé</div>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <div className="text-xs text-white/70">Traçabilité</div>
                    <div className="mt-1 font-bold">Données centralisées</div>
                  </div>
                </div>

                <div className="mt-6 text-xs text-white/60">
                  Astuce : si vous ne changez pas votre mot de passe, laissez les
                  champs “Password” vides.
                </div>
              </div>
            </div>

            {/* Right form card */}
            <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-b from-white to-slate-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                      Profil utilisateur
                    </div>
                    <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                      Update Profile
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Renseignez les informations puis enregistrez.
                    </p>
                  </div>

                  {/* ✅ AGIL badge (no diggow) */}
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      <img
                        src={AgilLogo}
                        alt="AGIL"
                        className="w-4 h-4 object-contain"
                      />
                      AGIL
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {error.__html && (
                  <div
                    className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm font-semibold"
                    dangerouslySetInnerHTML={error}
                  />
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">
                      Name
                    </label>
                    <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                      <UserCircleIcon className="w-5 h-5 text-slate-400" />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={name}
                        onChange={handleChange}
                        className="w-full outline-none text-sm text-slate-900 placeholder-slate-400"
                        placeholder="Name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">
                      Email
                    </label>
                    <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                      <EnvelopeIcon className="w-5 h-5 text-slate-400" />
                      <input
                        id="email-address"
                        name="email"
                        type="email"
                        value={email}
                        onChange={handleChange}
                        className="w-full outline-none text-sm text-slate-900 placeholder-slate-400"
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  {/* Phone + Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase">
                        Phone
                      </label>
                      <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                        <PhoneIcon className="w-5 h-5 text-slate-400" />
                        <input
                          id="numtelephone"
                          name="numtelephone"
                          type="text"
                          value={numTelephone}
                          onChange={handleChange}
                          className="w-full outline-none text-sm text-slate-900 placeholder-slate-400"
                          placeholder="Phone Number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase">
                        Address
                      </label>
                      <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                        <MapPinIcon className="w-5 h-5 text-slate-400" />
                        <input
                          id="adresse"
                          name="adresse"
                          type="text"
                          value={adresse}
                          onChange={handleChange}
                          className="w-full outline-none text-sm text-slate-900 placeholder-slate-400"
                          placeholder="Address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* File upload */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase">
                      Photo de profil
                    </label>

                    <input
                      id="imageduprofile"
                      name="imageduprofile"
                      type="file"
                      onChange={handleChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={handleFileClick}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition flex items-center justify-between"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ArrowUpOnSquareIcon
                          className="h-5 w-5 text-slate-400"
                          aria-hidden="true"
                        />
                        <span className="text-slate-600">{imageName}</span>
                      </span>

                      <span className="text-xs text-slate-500">
                        Choisir un fichier
                      </span>
                    </button>
                    <p className="mt-1 text-xs text-slate-500">
                      Formats recommandés: JPG/PNG • Taille raisonnable.
                    </p>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase">
                        Password
                      </label>
                      <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                        <KeyIcon className="w-5 h-5 text-slate-400" />
                        <input
                          id="password"
                          name="password"
                          type="password"
                          value={password}
                          onChange={handleChange}
                          className="w-full outline-none text-sm text-slate-900 placeholder-slate-400"
                          placeholder="Password"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 uppercase">
                        Confirmation
                      </label>
                      <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                        <KeyIcon className="w-5 h-5 text-slate-400" />
                        <input
                          id="password_confirmation"
                          name="password_confirmation"
                          type="password"
                          value={passwordConfirmation}
                          onChange={handleChange}
                          className="w-full outline-none text-sm text-slate-900 placeholder-slate-400"
                          placeholder="Password Confirmation"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="group relative flex w-full justify-center rounded-2xl border border-transparent bg-indigo-600 py-3 px-4 text-sm font-extrabold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm"
                    >
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                        <LockClosedIcon
                          className="h-5 w-5 text-indigo-200 group-hover:text-indigo-100"
                          aria-hidden="true"
                        />
                      </span>
                      Update Profile
                    </button>

                    <div className="mt-3 text-xs text-slate-500 text-center">
                      Support IT :{" "}
                      <span className="font-semibold">xxxxx@xxxxx.tn</span> •{" "}
                      <span className="font-semibold">xx xxx xxx</span>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Footer small */}
          <div className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} AGIL — SAGES (Gestion & Service)
          </div>
        </div>

      </div>
    </>
  );
};

export default Home;
