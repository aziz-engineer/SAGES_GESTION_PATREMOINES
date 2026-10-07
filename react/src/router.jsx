import { createBrowserRouter, Navigate } from "react-router-dom";
import DefaultLayout from "./components/DefaultLayout";
import GuestLayout from "./components/GuestLayout";
import UpdateProfile from "./views/Home";
import Login from "./views/Login";
import Signup from "./views/Signup";
import FacebookCalendar from "./views/Calendar";
import Facebook from "./views/ImageUpload";
//import Analyse from "./views/Analyse";
import Instagram from "./views/Instagram";
import FullCalendarInsta from "./views/FullCalendarInsta";
import InstagramCalendar from "./views/InteractifCalendarIns";
import Te2 from "./views/Te2";
import T3 from "./views/T3";
import Patrimoine from "./views/Patrimoine";
import Reglements from "./views/Reglements";



import PasswordReset from "./views/PasswordReset";
import PasswordForgot from "./views/PasswordForgot";


// 
const router = createBrowserRouter([
  {
    path: "/",
    element: <DefaultLayout />,
    children: [
      {
        path: "/",
        element: <UpdateProfile />,
        key: "UpdateProfile",
      }, {
        path: "/CalendarComponent",
        element: <FacebookCalendar />,
        key: "FacebookCalendar",
      },
      {
        path: "/Instagram",
        element: <Instagram />,
        key: "Instagram",
      },
      {
        path: "/Te2",
        element: <Te2 />,
        key: "test2",
      },
      {
        path: "/T3",
        element: <T3 />,
        key: "test3",
      },
      {
        path: "/patrimoine",
        element: <Patrimoine />,
        key: "patrimoine",
      },
      {
        path: "/reglements",
        element: <Reglements />,
        key: "reglements",
      },
     /* {
        path: "/FullCalendarInsta",
        element: <FullCalendarInsta />,
        key: "FullCalendarInsta",
      },*/
      {
        path: "/InteractifCalendarIns",
        element: <InstagramCalendar />,
        key: "InstagramCalendar",
      },
      /* {
        path: "/Analyse",
        element: <Analyse />,
        key: "Analyse",
      },*/
      // CalendarComponent Analyse
// Analyse
      
      {
        path: "/upload-image",
        element: <Facebook />,
        key: "Facebook",
      },
    ],
  },
  {
    path: "/",
    element: <GuestLayout />,
    children: [
      {
        path: "/login",
        element: <Login />,
        key: "login",
      },
      {
        path: "/signup",
        element: <Signup />,
        key: "signup",
      },
      {
        path: "/passwordreset",
        element: <PasswordReset />,
        key: "passwordreset",
      },
      {
        path: "/passwordforgot",
        element: <PasswordForgot />,
        key: "passwordforgot",
      },
    ],
  },
]);

export default router;
