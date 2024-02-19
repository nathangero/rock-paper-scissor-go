import { Link } from "react-router-dom";


export default function Error() {

  return (
    <>
      <div className="text-center">
        <h1>Oops! This page does not exist</h1>
        <Link to="/">Take me home please.</Link>
      </div>
    </>
  )
}