
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../firebase.ts";

import Alert from "../Alert/index.js";
import LoadingSpinner from "../LoadingSpinner/index.jsx";
import { addUser, doesUsernameExist } from "../../utils/rtdb.ts";
import { useAppDispatch } from "../../redux/hooks.ts";
import { USER_ACTIONS } from "../../redux/reducer.ts";

enum ALERT_TYPE {
  INVALID_SIGNUP_USERNAME = "invalid_signup_username",
  INVALID_SIGNUP_EMAIL = "invalid_signup_email",
}

export default function Signup() {

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [loadingSpinner, setLoadingSpinner] = useState<Modal | null>(null);

  const [modalAlert, setModalAlert] = useState<Modal | null>(null);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertBody, setAlertBody] = useState('');

  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [isSignupUsernameValid, setIsSignupUsernameValid] = useState(false);
  const [isCheckingUsernameAvailablility, setIsCheckingUsernameAvailablility] = useState(false);
  const [isSignupUsernameAvailable, setIsSignupUsernameAvailable] = useState(false);
  const [isSignupEmailValid, setIsSignupEmailValid] = useState(false);
  const [isSignupPasswordValid, setIsSignupPasswordValid] = useState(false);

  const [timeoutId, setTimeoutId] = useState<number | null>(null);


  useEffect(() => {
    // Initialize bootstrap modals 
    const modalError = document.querySelector<HTMLDivElement>(".alert-modal-error")?.querySelector<HTMLDivElement>("#alertModal");
    if (modalError) setModalAlert(new Modal(modalError));

    const loadingSpinner = document.querySelector<HTMLDivElement>(".loading-spinner")?.querySelector<HTMLDivElement>("#modal-loading-spinner");
    if (loadingSpinner) setLoadingSpinner(new Modal(loadingSpinner));
  }, []);

  // Disables Sign Up button if username and password criteria all pass
  useEffect(() => {
    const signupButton = document.querySelector(".button-signup");
    if (signupButton && isSignupUsernameValid && !isCheckingUsernameAvailablility && isSignupUsernameAvailable && isSignupEmailValid && isSignupPasswordValid) signupButton.removeAttribute("disabled");
    else if (signupButton) signupButton.setAttribute("disabled", "");
  }, [isSignupUsernameValid, isCheckingUsernameAvailablility, isSignupUsernameAvailable, isSignupEmailValid, isSignupPasswordValid]);

  /**
   * Checks the database if the username is available to use.
   * If `data` is null, the username is available,
   * else the username is taken already.
   * @param {String} username 
   */
  const checkUsernameAvailability = async (username: string) => {
    try {
      const isAvailable = await doesUsernameExist(username);
      // console.log("isAvailable:", isAvailable);
      setIsCheckingUsernameAvailablility(false);

      //If the username already exists, don't let the user sign up
      setIsSignupUsernameAvailable(!isAvailable);
    } catch (error) {
      // This shouldn't really run
      console.log("Couldn't check db for username");
      console.error(error);
    }
  }

  /**
   * Updates the `signupUsername` variable as the user types in the input field.
   * After the user stops typing for a certain amount of milliseconds, the `checkUsernameAvailability()` function will be called.
   * @param {Event} event 
   * @returns null if username isn't valid
   */
  const onChangeSignupUsername = ({ target }: ChangeEvent<HTMLInputElement>) => {
    const username = target.value;
    setSignupUsername(username);

    if (username.length < 3 || username.length >= 30) {
      setIsSignupUsernameValid(false);
      return;
    }

    setIsSignupUsernameValid(true);

    // Check username availability after user stops typing
    setIsCheckingUsernameAvailablility(true);
    if (timeoutId) clearTimeout(timeoutId); // Prevents timer from triggering until user has completely stopped typing
    const id = window.setTimeout(async () => {
      await checkUsernameAvailability(username);
    }, 500)
    setTimeoutId(id);
  }

  const onChangeSignupEmail = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setSignupEmail(target.value);

    // Checks if the email entered is valid
    const regex = /^([+\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    setIsSignupEmailValid(regex.test(target.value));
  }

  const onChangeSignupPassword = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setSignupPassword(target.value);
    if (target.value.length >= 6) setIsSignupPasswordValid(true);
    else setIsSignupPasswordValid(false);
  }

  const toggleSignupPassword = () => {
    setShowSignupPassword(!showSignupPassword);
  }

  const toggleModalError = (alertType: ALERT_TYPE) => {
    switch (alertType) {
      case ALERT_TYPE.INVALID_SIGNUP_EMAIL:
        setAlertTitle("Invalid Sign Up");
        setAlertBody("Email already in use.");
        break;

      case ALERT_TYPE.INVALID_SIGNUP_USERNAME:
        setAlertTitle("Invalid Sign Up");
        setAlertBody("Username already exists. Please try another.");
        break;
    }

    modalAlert?.toggle();
  }

  const toggleLoadingSpinner = () => {
    loadingSpinner?.toggle();
  }

  const onSubmitSignup = async (e: FormEvent) => {
    e.preventDefault();

    try {
      toggleLoadingSpinner();
      await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      if (!auth.currentUser) {
        toggleLoadingSpinner(); // Stop spinner early
        throw ("firebase: couldn't sign up");
      }

      // console.log("auth.currentUser:", auth.currentUser.uid);
      const uid = auth.currentUser.uid;
      const newUser = await addUser(uid, signupEmail, signupUsername);
      dispatch({
        type: USER_ACTIONS.LOGIN,
        user: newUser
      })

      // Stop spinner after store is updated
      toggleLoadingSpinner();

      // Redirect the user to the home page and force a refresh.
      navigate("/");
    } catch (error) {
      console.log("couldn't sign up");
      console.error(error);
      toggleLoadingSpinner();
      toggleModalError(ALERT_TYPE.INVALID_SIGNUP_EMAIL);
    }
  }

  return (
    <>
      <form id="signup-form" className="" onSubmit={onSubmitSignup}>
        <label htmlFor="signup-username" className="text-start fs-5">Username:</label>
        <input
          id="signup-username"
          type="text"
          className="form-control"
          value={signupUsername}
          onChange={onChangeSignupUsername}
          placeholder="Billy the Kid"
          autoComplete="new-password"
        />
        <div className="mt-1">
          {!isSignupUsernameValid ? // First, show if username isn't valid
            <p className="text-danger">*Username must be between 3-30 characters</p> :
            <>
              {isCheckingUsernameAvailablility ? // Second, show user mongodb is checking for the username
                <p className="text-secondary">Checking username availability...</p> :
                <>
                  {isSignupUsernameAvailable ? // Lastly, after timer is done, show availability
                    <p className="text-success"><i className="bi bi-check-circle"></i> Username is available</p> :
                    <p className="text-danger"><i className="bi bi-x-circle"></i> Username is taken</p>
                  }
                </>
              }
            </>

          }
        </div>

        <label htmlFor="signup-email" className="text-start fs-5">Email:</label>
        <input
          type="email"
          id="signup-email"
          className="form-control"
          value={signupEmail}
          onChange={onChangeSignupEmail}
          placeholder="test@example.com"
          autoComplete="new-password"
        />
        {!isSignupEmailValid || signupEmail.length === 0 ?
          <p className="text-danger">*Enter a valid email</p> : <br />
        }

        <label htmlFor="signup-password" className="fs-5 mb-0">Password:</label>
        <div className="container-fluid d-inline-flex px-0 border rounded container-password">
          <input
            id="signup-password"
            type={showSignupPassword ? "text" : "password"}
            className="form-control border-0"
            value={signupPassword}
            onChange={onChangeSignupPassword}
            placeholder="******"
            autoComplete="new-password"
          />
          <button className="btn mx-0 border" onClick={toggleSignupPassword} type="button"><i className={showSignupPassword ? "bi bi-eye-fill" : "bi bi-eye-slash-fill"}></i></button>
        </div>
        {!isSignupPasswordValid ?
          <p className="text-danger">*Password must have at least 6 characters</p> : null
        }

        <div className="text-center mt-3">
          <button className="btn button-positive fs-4 px-3 button-signup" type="submit" disabled>Sign Up</button>
        </div>
      </form>

      <br />


      <div className="alert-modal-error">
        <Alert title={alertTitle} body={alertBody} />
      </div>

      <div className="loading-spinner">
        <LoadingSpinner spinnerText={"Signing up..."} />
      </div>
    </>
  )
}