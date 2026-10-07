import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ContextProvider } from "./contexts/ContextProvider";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import router from "./router.jsx";
import Modal from 'react-modal'; // Importer react-modal
// Définir l'élément racine de l'application
Modal.setAppElement('#root');

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ContextProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
        limit={4}
        style={{ zIndex: 20000, top: "80px" }}
      />
    </ContextProvider>
  </React.StrictMode>
);
