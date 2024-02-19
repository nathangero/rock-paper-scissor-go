import { Link } from "react-router-dom";

export default function Navbar() {

  return (
    <header>
      <nav className="navbar">
        <Link to={"/"}>Home</Link>
        <Link to={"/profile/0"}>Profile</Link>
      </nav>
    </header>
  )
}