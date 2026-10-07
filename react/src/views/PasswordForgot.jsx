import React, { useState } from 'react';
import { LockClosedIcon } from "@heroicons/react/20/solid";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import '../styles/forgot.css';
import connexion from "../assets/images/connexion.jpg";
import { API_BASE_URL } from "../apiConfig";

const PasswordForgot = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/passwordreset'); // Navigue vers la page forgot
  };


  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
        email,
      });
      setMessage(response.data.status);
      toast.success("Lien de reinitialisation envoye avec succes.");
    } catch (error) {
      setError(error.response.data.email[0]);
      toast.error(error?.response?.data?.email?.[0] || "Erreur lors de l'envoi du lien.");
    }
  };

  return (
    <>
      <div className="register">
       
       <div className="register-container">
         {/* -------------- image --------------------- */}
         <div className="register-img">
           <img
             src={connexion}
             alt=""
           />
         </div>
         {/* -------------form--------------------- */}
         <div className="register-all-content">
           <div className="register-content">
             <div className="register-logo">
               <img
                 src="https://app.diggow.com/static/media/Slice1.68f697e8434b8cfbbdb67c6001ea39bc.svg"
                 alt=""
               />
               <h3>diggow</h3>
             </div>
             <div className="register-welcome">
               <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Forgot Password
      </h2>

                </div>
              
                {error && (
        <div className="bg-red-500 rounded py-2 px-3 text-white">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-500 rounded py-2 px-3 text-white">
          {message}
        </div>
      )}


      <form onSubmit={handleForgotPassword} className="mt-8 space-y-6">
        <div className="-space-y-px rounded-md shadow-sm">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <LockClosedIcon
                className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                aria-hidden="true"
              />
            </span>
            Send  Link
          </button>
        </div>
        <div>
        <button
        type="button" // Changez le type en "button" pour éviter la soumission du formulaire
        onClick={handleClick} // Appelle la fonction handleClick lors du clic
        className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <LockClosedIcon
            className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
            aria-hidden="true"
          />
        </span>
        reset
      </button>
        </div>
      </form>
        </div>
    </div>
            </div>     

            </div>
    </>
  );
};

export default PasswordForgot;
