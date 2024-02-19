import { useEffect } from "react";
import "./style.css";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const NAV_LINKS = {
    HOME: "/",
    PROFILE: "/profile",
  };

  const location = useLocation();

  useEffect(() => {
    console.log("locatin:", location.pathname);
  }, [location])

  return (
    <header>
      <nav className="navbar navbar-expand-sm">
        <div className="container-fluid">
          <Link to={NAV_LINKS.HOME} className="navbar-brand">ICON</Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#navbar"
            aria-controls="offcanvas"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            id="navbar"
            className="offcanvas offcanvas-end navbar-offcanvas justify-content-end"
            tabIndex={-1}
            aria-labelledby="offcanvasNavbarLabel"
          >
            <div className="offcanvas-header justify-content-end">
              <button
                id="button-close-offcanvas"
                type="button"
                className="btn-close fs-3"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>

            <div id="sidemenu" className="offcanvas-body">
              <ul className="navbar-nav nav-underline fs-5 justify-content-end flex-grow-1 pe-3" data-bs-dismiss="offcanvas">
                <li>
                  <Link
                    to={NAV_LINKS.HOME}
                    className={`${location.pathname === NAV_LINKS.HOME ? "nav-link active": "nav-link"}`}
                  >
                    Home
                  </Link>
                </li>

                <li>
                  <Link
                    to={`${NAV_LINKS.PROFILE}/${0}`}
                    className={`${location.pathname === NAV_LINKS.PROFILE ? "nav-link active": "nav-link"}`}
                  >
                    Profile
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}