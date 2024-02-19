import { useEffect } from 'react'
import './App.css'
import { Outlet } from "react-router-dom"
import Navbar from "./components/Navbar"

function App() {

  useEffect(() => {
  })

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

export default App
