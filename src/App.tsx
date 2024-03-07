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
        // Just remove the "Loading" text right away
        setLoading(false);
      }
    })
  })

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
