import { Fragment, useState } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  UserCircleIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  HomeModernIcon,
  HomeIcon,
  ClockIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useStateContext } from "../contexts/ContextProvider";
import axiosClient from "../axios";
import { useEffect } from "react";
import { toast } from "react-toastify";

// ✅ AGIL logo (mets-le dans: src/assets/Agil_Logo.gif)
import AgilLogo from "../assets/Agil_Logo.gif";

// Liens communs, visibles quel que soit le projet actif
const commonNavigation = [
  { name: "Accueil", to: "/Instagram", icon: HomeIcon },
];

// Liens propres à chaque "projet" de la navbar, avec un thème de couleur dédié
const projects = {
  patrimoine: {
    key: "patrimoine",
    label: "Gestion de Patrimoine",
    shortLabel: "Patrimoine",
    icon: BuildingOffice2Icon,
    theme: {
      chipActive: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
      accentText: "text-indigo-400",
      accentBorder: "border-indigo-400",
      linkActive: "bg-indigo-500/15 text-white ring-1 ring-inset ring-indigo-400/40",
    },
    navigation: [
      { name: "Patrimoine", to: "/patrimoine", icon: BuildingOffice2Icon },
      { name: "Historique", to: "/upload-image", icon: ClockIcon },
    ],
  },
  locataire: {
    key: "locataire",
    label: "Gestion de Locataire",
    shortLabel: "Locataire",
    icon: HomeModernIcon,
    theme: {
      chipActive: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
      accentText: "text-emerald-400",
      accentBorder: "border-emerald-400",
      linkActive: "bg-emerald-500/15 text-white ring-1 ring-inset ring-emerald-400/40",
    },
    navigation: [
      { name: "Fiche Locataires", to: "/T3", icon: Squares2X2Icon },
      { name: "Contrats", to: "/CalendarComponent", icon: DocumentTextIcon },
      { name: "Facturation", to: "/Te2", icon: CurrencyDollarIcon },
      { name: "Règlements", to: "/reglements", icon: BanknotesIcon },
      { name: "Rapport Factures", to: "/InteractifCalendarIns", icon: ChartBarIcon },
    ],
  },
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DefaultLayout() {
  const { currentUser, userToken, setCurrentUser, setUserToken } =
    useStateContext();

  const [activeProjectKey, setActiveProjectKey] = useState(
    () => localStorage.getItem("ACTIVE_PROJECT") || "patrimoine"
  );

  const setActiveProject = (key) => {
    localStorage.setItem("ACTIVE_PROJECT", key);
    setActiveProjectKey(key);
  };

  const activeProject = projects[activeProjectKey];
  const navigation = [...commonNavigation, ...activeProject.navigation];
  const initials = (currentUser?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (!userToken) {
    return <Navigate to="login" />;
  }

  const logout = (ev) => {
    ev.preventDefault();
    axiosClient.post("/logout").then((res) => {
      setCurrentUser({});
      setUserToken(null);
      toast.success("Deconnexion effectuee avec succes.");
      console.log(res);
    }).catch((error) => {
      toast.error(error?.response?.data?.message || "Erreur lors de la deconnexion.");
    });
  };

  useEffect(() => {
    axiosClient.get("/auth").then(({ data }) => {
      setCurrentUser(data);
      console.log(data);
    });
  }, []);

  return (
    <>
      <div className="min-h-full pt-28">
        <Disclosure as="nav" className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-900/95 shadow-lg shadow-black/20 backdrop-blur-md">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Row 1: brand · project switcher · profile */}
                <div className="flex h-16 items-center justify-between">
                  {/* Brand */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-xl bg-white p-1 ring-1 ring-white/10"
                        src={AgilLogo}
                        alt="AGIL"
                      />
                    </div>
                    <div className="hidden sm:block leading-tight">
                      <div className="text-white font-semibold tracking-wide">
                        SAGES
                      </div>
                      <div className="text-slate-400 text-xs">
                        Société de Gestion &amp; Service
                      </div>
                    </div>
                  </div>

                  {/* Project switcher (desktop) */}
                  <div className="hidden md:flex flex-1 justify-center">
                    <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
                      {Object.values(projects).map((project) => {
                        const Icon = project.icon;
                        const isActive = project.key === activeProjectKey;
                        return (
                          <button
                            key={project.key}
                            type="button"
                            onClick={() => setActiveProject(project.key)}
                            className={classNames(
                              isActive
                                ? project.theme.chipActive
                                : "text-slate-300 hover:bg-white/10 hover:text-white",
                              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {project.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: profile */}
                  <div className="hidden md:flex items-center">
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-xs font-semibold text-white">
                          {initials}
                        </span>
                        <span className="hidden lg:block text-slate-200 max-w-[8rem] truncate">
                          {currentUser?.name || "Utilisateur"}
                        </span>
                        <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                      </Menu.Button>

                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-60 origin-top-right rounded-xl bg-white py-1 shadow-xl ring-1 ring-black/5 focus:outline-none">
                          <div className="px-4 py-3 border-b">
                            <div className="text-sm font-semibold text-gray-900">
                              {currentUser?.name || "Utilisateur"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {currentUser?.email || ""}
                            </div>
                          </div>

                          <Menu.Item>
                            {({ active }) => (
                              <NavLink
                                to="/"
                                className={classNames(
                                  active ? "bg-gray-50" : "",
                                  "flex items-center gap-2 px-4 py-2 text-sm text-gray-700"
                                )}
                              >
                                <UserCircleIcon className="h-4 w-4" />
                                Mon Profil
                              </NavLink>
                            )}
                          </Menu.Item>

                          <Menu.Item>
                            {({ active }) => (
                              <a
                                href="#"
                                onClick={(ev) => logout(ev)}
                                className={classNames(
                                  active ? "bg-gray-50" : "",
                                  "flex items-center gap-2 px-4 py-2 text-sm text-red-600"
                                )}
                              >
                                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                Se déconnecter
                              </a>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>

                  {/* Mobile menu button */}
                  <div className="flex md:hidden">
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>

                {/* Row 2: nav links for the active project (desktop) */}
                <div className="hidden md:flex h-12 items-center gap-1 border-t border-white/5">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.to}
                        className={({ isActive }) =>
                          classNames(
                            isActive
                              ? activeProject.theme.linkActive
                              : "text-slate-400 hover:bg-white/5 hover:text-white",
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                          )
                        }
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              {/* Mobile */}
              <Disclosure.Panel className="md:hidden border-t border-white/10">
                <div className="flex items-center gap-2 px-4 pt-3">
                  {Object.values(projects).map((project) => {
                    const Icon = project.icon;
                    const isActive = project.key === activeProjectKey;
                    return (
                      <button
                        key={project.key}
                        type="button"
                        onClick={() => setActiveProject(project.key)}
                        className={classNames(
                          isActive
                            ? project.theme.chipActive
                            : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
                          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {project.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1 px-4 pt-3 pb-3">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.to}
                        className={({ isActive }) =>
                          classNames(
                            isActive
                              ? activeProject.theme.linkActive
                              : "text-slate-300 hover:bg-white/10 hover:text-white",
                            "flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium"
                          )
                        }
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </NavLink>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 pt-4 pb-3">
                  <div className="flex items-center px-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-xs font-semibold text-white">
                      {initials}
                    </span>
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">
                        {currentUser.name}
                      </div>
                      <div className="text-sm font-medium leading-none text-slate-400 mt-1">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 px-2">
                    <Disclosure.Button
                      as="a"
                      href="#"
                      onClick={(ev) => logout(ev)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Se déconnecter
                    </Disclosure.Button>
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <Outlet />
      </div>
    </>
  );
}
