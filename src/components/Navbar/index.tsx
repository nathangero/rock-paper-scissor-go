import { useEffect } from "react";
import "./style.css";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { auth } from "../../../firebase";
import { USER_ACTIONS } from "../../redux/reducer";

export default function Navbar() {
  enum NAV_LINKS {
    HOME = "/",
    PROFILE = "/profile",
    LOGIN = "/login",
  }

  const user = useAppSelector(state => state.user);
  const lobby = useAppSelector(state => state.lobby);
  const dispatch = useAppDispatch();

  const location = useLocation();

  useEffect(() => {
  })

  const onClickLogout = async () => {
    await auth.signOut();
    dispatch({
      type: USER_ACTIONS.LOGOUT
    });

    window.location.href = "/";
  }

  return (
    <header>
      {lobby ? null :
        <nav className="navbar navbar-expand-sm mb-2">
          <div className="container-fluid">
            <Link to={NAV_LINKS.HOME} className="navbar-brand">RPS GO!</Link>

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
                      className={`${location.pathname === NAV_LINKS.HOME ? "nav-link active" : "nav-link"}`}
                    >
                      Home
                    </Link>
                  </li>

                  {!user?.email ? null :
                    <li>
                      <Link
                        to={`${NAV_LINKS.PROFILE}/${user.username}`}
                        className={`${location.pathname.includes(NAV_LINKS.PROFILE) ? "nav-link active" : "nav-link"}`}
                      >
                        Profile
                      </Link>
                    </li>
                  }

                  <li>
                    {user?.email ?
                      <a type="button" className="nav-link" onClick={() => onClickLogout()}>Logout</a> :
                      <Link
                        to={NAV_LINKS.LOGIN}
                        className={`${location.pathname === NAV_LINKS.LOGIN ? "nav-link active" : "nav-link"}`}
                      >
                        Login
                      </Link>
                    }
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </nav>
      }
    </header >
  )
}