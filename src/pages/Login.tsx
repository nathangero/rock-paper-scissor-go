
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Modal } from "bootstrap";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase.ts";

import Alert from "../components/Alert/index.js";
import Signup from "../components/Signup/index.tsx";
import LoadingSpinner from "../components/LoadingSpinner/index.js";
import { useNavigate } from "react-router-dom";
import { dbGetUser } from "../utils/rtdb.ts";
import { useAppDispatch } from "../redux/hooks.ts";
import { USER_ACTIONS } from "../redux/reducer.ts";
// import { FirebaseError } from "@firebase/util";
// import Logo from "../components/Logo/index.jsx";

const ALERT_TYPE = {
  INVALID_LOGIN: "invalid_login",
  USER_NOT_FOUND: "user_not_found",
  NETWORK_ERROR: "network_error",
}

export default function Login() {

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [loadingSpinner, setLoadingSpinner] = useState<Modal | null>(null);

  const [modalAlert, setModalAlert] = useState<Modal | null>(null);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertBody, setAlertBody] = useState('');

  const [modalResetPassword, setModalResetPassword] = useState<Modal | null>(null);
  const [didSendResetPassword, setDidSendResetPassword] = useState(false);
  const [isSendingResetPassword, setIsSendingResetPassword] = useState(false); // Shows the user text that the password reset email is sending

  const [showSignup, setSignup] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [isResetPasswordEmailInvalid, setIsResetPasswordEmailInvalid] = useState(false);


  useEffect(() => {
    // Initialize bootstrap modals 
    const modalError = document.querySelector<HTMLDivElement>(".alert-modal-error")?.querySelector<HTMLDivElement>("#alertModal");
    if (modalError) setModalAlert(new Modal(modalError));

    const modalResetPass = document.querySelector<HTMLDivElement>(".alert-modal-reset-password")?.querySelector<HTMLDivElement>("#alertModal");
    if (modalResetPass) setModalResetPassword(new Modal(modalResetPass));

    const loadingSpinner = document.querySelector<HTMLDivElement>(".loading-spinner")?.querySelector<HTMLDivElement>("#modal-loading-spinner");
    if (loadingSpinner) setLoadingSpinner(new Modal(loadingSpinner));
  }, []);

  const onChangeLoginEmail = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setLoginEmail(target.value);
  }

  const onChangeLoginPassword = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setLoginPassword(target.value);
  }

  const onChangePasswordResetEmail = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setPasswordResetEmail(target.value);
  }

  const toggleLoginPassword = () => {
    setShowLoginPassword(!showLoginPassword);
  }

  const toggleSignup = () => {
    setSignup(!showSignup);
  }

  const toggleLoadingSpinner = () => {
    loadingSpinner?.toggle();
  }

  const toggleModalError = (alertType: string) => {
    switch (alertType) {
      case ALERT_TYPE.INVALID_LOGIN:
        setAlertTitle("Invalid Login");
        setAlertBody("Email or password is invalid. Please check your credentials and try again.");
        break;

      case ALERT_TYPE.NETWORK_ERROR:
        setAlertTitle("Network Error");
        setAlertBody("There was an issue with accessing the network. Please try again.");
        break;

      case ALERT_TYPE.USER_NOT_FOUND:
        setAlertTitle("Invalid Login");
        setAlertBody("This user doesn't exist.");
    }

    modalAlert?.toggle();
  }

  const toggleModalResetPassword = () => {
    setDidSendResetPassword(false);
    modalResetPassword?.toggle();
  }

  const onSubmitLogin = async (e: FormEvent) => {
    e.preventDefault();

    try {
      toggleLoadingSpinner();
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toggleLoadingSpinner();

      if (!auth.currentUser) throw ("couldn't login");

      const user = await dbGetUser(auth.currentUser.uid);
      // console.log("user from dbGetUser:", user);
      dispatch({
        type: USER_ACTIONS.LOGIN,
        user: user
      })

      navigate("/");
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log("couldn't login");
      console.error(error);
      toggleLoadingSpinner();
      if (error.code === "auth/network-request-failed") {
        toggleModalError(ALERT_TYPE.NETWORK_ERROR);
      } else if (error.code === "auth/user-not-found") {
        toggleModalError(ALERT_TYPE.USER_NOT_FOUND);
      } else {
        toggleModalError(ALERT_TYPE.INVALID_LOGIN);
      }
    }
  }

  const onSubmitResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setIsSendingResetPassword(true);
      await sendPasswordResetEmail(auth, passwordResetEmail);
      setIsSendingResetPassword(false);
      setPasswordResetEmail('');
      setDidSendResetPassword(true);
    } catch (error) {
      setIsSendingResetPassword(false);
      setIsResetPasswordEmailInvalid(true);
      console.error(error);
      console.log("couldn't send email");
    }
  }

  const renderLogin = () => {
    return (
      <>
        <form id="login-form" onSubmit={onSubmitLogin}>
          <label htmlFor="login-email" className="text-start fs-5">Email:</label>
          <input
            id="login-email"
            type="email"
            className="form-control"
            value={loginEmail}
            onChange={onChangeLoginEmail}
            placeholder="test@example.com"
          />
          <br />

          <label htmlFor="login-password" className="fs-5 mb-0">Password:</label>
          <div className="container-fluid d-inline-flex border rounded px-0 container-password">
            <input
              id="login-password"
              type={showLoginPassword ? "text" : "password"}
              className="form-control border-0"
              value={loginPassword}
              onChange={onChangeLoginPassword}
              placeholder="******"
            />
            <button className="btn mx-0 border" onClick={toggleLoginPassword} type="button" aria-label={showLoginPassword ? "Hide password" : "Show password"}><i className={showLoginPassword ? "bi bi-eye-fill" : "bi bi-eye-slash-fill"}></i></button>
          </div>

          <div className="text-center mt-3">
            <button className="btn button-positive fs-4 px-3" type="submit">Login</button>
          </div>
        </form>

        <br />
        <p className="text-center fs-5">Need an account? <a className="button-link" onClick={toggleSignup} type="button">Sign up here</a></p>
        <p className="text-center fs-5">Forgot your password? <a className="button-link" onClick={toggleModalResetPassword} type="button">Click here</a></p>

      </>
    )
  }

  const renderResetPassword = () => {
    return (
      <>
        {didSendResetPassword ?
          <>
            <p>
              Email sent! Please check your inbox.
            </p>
            <div className="text-end">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </> :
          <>
            <label className="modal-title text-center fs-5">Enter your email:</label>

            <form onSubmit={onSubmitResetPassword}>
              <input
                type="email"
                className="form-control"
                value={passwordResetEmail}
                onChange={onChangePasswordResetEmail}
              />

              {isResetPasswordEmailInvalid ? // Text notifying if the email doesn't exist in the Firebase database
                <p className="text-danger">*Email doesn't exist</p> :
                null
              }

              <div className="text-center mt-3">
                <button className="btn button-negative fs-4 px-3" type="submit">Reset Password</button>
              </div>
            </form>
          </>
        }
      </>
    )
  }

  return (
    <section className="page-login">
      <div className="d-flex flex-column align-items-center">
        <div className="container-fluid">
          {!showSignup ?
            renderLogin() :
            <>
              <Signup />

              <p className="text-center fs-5">Already have an account? <a className="button-link" onClick={toggleSignup} type="button">Login here</a></p>
            </>

          }
        </div>
      </div>

      <div className="alert-modal-error">
        <Alert title={alertTitle} body={alertBody} />
      </div>

      <div className="alert-modal-reset-password">
        <div className="modal fade" id="alertModal" tabIndex={-1} aria-labelledby="alertModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Password Reset</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body custom-modal-body">
                {isSendingResetPassword ? // Show user the password reset email is sending.
                  <h4 className="text-center">Sending password reset email...</h4> :
                  renderResetPassword()
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="loading-spinner">
        <LoadingSpinner spinnerText={"Logging in..."} />
      </div>
    </section>
  )
}