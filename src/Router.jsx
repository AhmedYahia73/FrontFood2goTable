import React from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./Pages/Home/Home";
import Products from "./Pages/Products/Product";
import LandingPage from "./Pages/LandingPage/LandingPage";
import Menu from "./Pages/Menu/Menu";
import Branch from "./Pages/Branch/Branch";
import Cart from "./Pages/Cart/Cart";
import Support from "./Pages/SupportPrivacy/Support";
import PrivacyPolicy from "./Pages/SupportPrivacy/PrivacyPolicy";
import ElectronicMenu from "./Pages/ElectronicMenu/ElectronicMenu";
import ElectronicMenuLanding from "./Pages/ElectronicMenu/ElectronicMenuLanding";
import ProtectedOrderRoute from "./ProtectedData/ProtectedOrderRoute";
import CallWaiter from "./Pages/CallWaiter/CallWaiter";
import QRScanner from "./Pages/QRScan/QRScanner";
import MyOrderTracking from "./Pages/OrderTracking/MyOrderTracking";

export const router = createBrowserRouter(
  [
    {
      path: "",
      element: <App />,
      children: [
        // Public routes
        {
          path: "",
          element: <LandingPage />,
        },
        {
          path: "menu",
          element: <Menu />,
        },
        {
          path: "branches",
          element: <Branch />,
        },
        {
          path: 'qr_scan',
          element: <QRScanner />,
        },
        {
          path: "support",
          element: <Support />
        },
        {
          path: "policy",
          element: <PrivacyPolicy />
        },
        {
          path: "electronic_menu",
          element: <ElectronicMenuLanding />
        },
        {
          path: "electronic_menu/items",
          element: <ElectronicMenu />
        },

        // Protected Ordering Routes
        {
          path: "",
          element: <ProtectedOrderRoute />,
          children: [
            {
              path: "home",
              element: <Home />,
            },
            {
              path: "order_online",
              element: <Home />,
            },
            {
              path: "products/:id",
              element: <Products />,
            },
            {
              path: "products",
              element: <Products />,
            },
            {
              path: "cart",
              element: <Cart />
            },
            {
              path: "call_waiter",
              element: <CallWaiter />
            },
            {
              path: "my_orders",
              element: <MyOrderTracking />
            },
          ]
        },
      ],
    },
  ],
  {
    basename: "/table",
  }
);
