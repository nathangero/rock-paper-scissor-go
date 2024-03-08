import './App.css'
import { useEffect, useState } from 'react'
import { Outlet } from "react-router-dom"
import Navbar from "./components/Navbar"
import { useAppDispatch } from "./redux/hooks"
import { auth } from "../firebase"
import { dbGetUser } from "./utils/rtdb"
import { USER_ACTIONS } from "./redux/reducer"
import Footer from "./components/Footer"
// import LoadingSpinner from "./components/LoadingSpinner"

function App() {

  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user?.uid) {
        // console.log("logging in user:", user.uid);

        // Get user info before removing "Loading" text
        const existingUser = await dbGetUser(user.uid);
        if (!existingUser) return;

        dispatch({
          type: USER_ACTIONS.LOGIN,
          user: existingUser
        });

        setLoading(false);
      } else {
        // console.log("no user logged in");
        // Create a random username and add it to the store
        const tempName = makeRandomUsername();
        const tempPlayer = { username: tempName }

        dispatch({
          type: USER_ACTIONS.LOGIN,
          user: tempPlayer
        })
        setLoading(false);
      }
    })
  })



  /**
   * Randomly generates a username for players not logged in.
   * @returns Randomly generated player name
   */
  const makeRandomUsername = (): string => {
    let name = "player";
    for (let i = 0; i < 10; i++) {
      name += Math.floor(Math.random() * 10);
    }

    return name;
  }

  if (loading) {
    return (
      <>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default App
