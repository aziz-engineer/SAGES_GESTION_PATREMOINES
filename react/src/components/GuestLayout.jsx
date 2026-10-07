import { Link, Navigate, Outlet } from "react-router-dom";
import { useStateContext } from "../contexts/ContextProvider";
// import { ShoppingCartIcon } from '@heroicons/react/outline';

export default function GuestLayout() {
  const { userToken } = useStateContext();

  if (userToken) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8"
                 // src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                 src="https://app.diggow.com/static/media/Slice1.68f697e8434b8cfbbdb67c6001ea39bc.svg"

                  alt="Logo"
                />
              </div>
             
            </div>
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link
                to="/login"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Login
              </Link>
              
              
              <Link
                to="/signup"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                Sign Up
              </Link>
            {/*  <Link
                to="/passwordreset"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
               reset
              </Link>
              <Link
                to="/passwordforgot"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
               forgot
              </Link> */}
              {/* <Link
                to="/cart"
                className="text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium"
              >
                <ShoppingCartIcon className="h-6 w-6 text-gray-900" aria-hidden="true" />
              </Link> */}
            </div>
            <div className="-mr-2 flex items-center md:hidden">
              <button
                type="button"
                className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                aria-controls="mobile-menu"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
                <svg
                  className="hidden h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/list_product_home_page"
              className="text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Home Page
            </Link>
            
            {/* /cart */}
            <Link
              to="/login"
              className="text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Sign Up
            </Link>
            <Link
              to="/passwordreset"
              className="text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
             reset
            </Link>
            <Link
              to="/passwordforgot"
              className="text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
             forgot
            </Link>
           
          </div>
        </div>
      </nav>

      <div className="flex flex-grow items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}