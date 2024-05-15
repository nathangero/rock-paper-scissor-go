import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";


import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ROUTER_LINKS } from "./utils/enums.ts";
import StoreProvider from "./redux/GlobalState.tsx";
import Error from "./pages/Error.tsx";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Profile from "./pages/Profile.tsx";
import Lobby from "./pages/Lobby.tsx";
import Practice from "./components/Practice/index.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: `${ROUTER_LINKS.PROFILE}/:id`,
        element: <Profile />
      },
      {
        path: ROUTER_LINKS.LOGIN,
        element: <Login />
      },
      {
        path: ROUTER_LINKS.PRACTICE,
        element: <Practice />
      },
      {
        path: ROUTER_LINKS.LOBBY,
        element: <Lobby />,
        children: [
          {
            path: ":lobbyType",
            element: <Lobby />
          },
          {
            path: ":lobbyType/finished",
            element: <Lobby />
          }
        ]
      },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  </React.StrictMode>,
)
