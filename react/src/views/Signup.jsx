import { Link, useNavigate } from "react-router-dom";
import { LockClosedIcon, ArrowUpOnSquareIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import axiosClient from '../axios.js';
import { useStateContext } from "../contexts/ContextProvider.jsx";
import { toast } from "react-toastify";

export default function Signup() {
  const { setCurrentUser, setUserToken } = useStateContext();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [imageduprofile, setImageDuProfile] = useState(null);
  const [imageName, setImageName] = useState('Choisir un fichier');
  const [numtelephone, setNumTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [error, setError] = useState({ __html: "" });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imageduprofile') {
      setImageDuProfile(files[0]);
      setImageName(files[0].name);
    } else if (name === 'numtelephone') {
      setNumTelephone(value);
    } else if (name === 'adresse') {
      setAdresse(value);
    } else if (name === 'name') {
      setFullName(value);
    } else if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    } else if (name === 'password_confirmation') {
      setPasswordConfirmation(value);
    }
  };

  const handleFileClick = () => {
    document.getElementById('imageduprofile').click();
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    setError({ __html: "" });

    const formData = new FormData();
    formData.append('name', fullName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', passwordConfirmation);
    if (imageduprofile) {
      formData.append('imageduprofile', imageduprofile);
    }
    formData.append('numtelephone', numtelephone);
    formData.append('adresse', adresse);

    axiosClient.post("/signup", formData)
      .then(({ data }) => {
        toast.success("Compte cree avec succes.");
        navigate("/login");
      })
      .catch((error) => {
        if (error.response) {
          const validationErrors = error.response.data?.errors || {};
          const finalErrors = Object.values(validationErrors).reduce((accum, next) => [...accum, ...next], []);
          console.log(finalErrors);
          setError({
            __html: finalErrors.length > 0
              ? finalErrors.join('<br>')
              : (error.response.data?.message || 'Creation du compte impossible.')
          });
        }
        toast.error("Echec de creation du compte.");
        console.error(error);
      });
  };

  return (
    <>
      <div>
        <img
          className="mx-auto h-12 w-auto"
          src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
          alt="Your Company"
        />
      </div>
      <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
        Signup for free
      </h2>

      {error.__html && (
        <div className="bg-red-500 rounded py-2 px-3 text-white" dangerouslySetInnerHTML={error}>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-8 space-y-6"
        action="#"
        method="POST"
      >
        <input type="hidden" name="remember" defaultValue="true" />
        <div className="-space-y-px rounded-md shadow-sm">
          <div>
            <label htmlFor="full-name" className="sr-only">
              Full Name
            </label>
            <input
              id="full-name"
              name="name"
              type="text"
              required
              value={fullName}
              onChange={handleChange}
              className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Full Name"
            />
          </div>
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
              onChange={handleChange}
              className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={handleChange}
              className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Password"
            />
          </div>
          <div>
            <label htmlFor="password-confirmation" className="sr-only">
              Password Confirmation
            </label>
            <input
              id="password-confirmation"
              name="password_confirmation"
              type="password"
              required
              value={passwordConfirmation}
              onChange={handleChange}
              className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Password Confirmation"
            />
          </div>
          <div className="relative">
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
              className="relative block w-full cursor-pointer appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 bg-white focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <span className="inline-flex items-center">
                <ArrowUpOnSquareIcon className="h-5 w-5 text-gray-400 mr-2" aria-hidden="true" />
                {imageName}
              </span>
            </button>
          </div>
          <div>
            <label htmlFor="numtelephone" className="sr-only">
              Phone Number
            </label>
            <input
              id="numtelephone"
              name="numtelephone"
              type="number"
              value={numtelephone}
              onChange={handleChange}
              className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Phone Number"
            />
          </div>
          <div>
            <label htmlFor="adresse" className="sr-only">
              Address
            </label>
            <input
              id="adresse"
              name="adresse"
              type="text"
              value={adresse}
              onChange={handleChange}
              className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              placeholder="Address"
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
            Signup
          </button>
        </div>
      </form>
    </>
  );
}
