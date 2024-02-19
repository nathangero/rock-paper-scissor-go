import './App.css'
import { useEffect } from 'react'
import { Outlet } from "react-router-dom"
import Navbar from "./components/Navbar"

function App() {

  useEffect(() => {
  })

  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default App
