import { useParams } from "react-router-dom";
import LobbyRoom from "../components/LobbyRoom";

export default function Lobby() {

  const { lobbyType } = useParams(); // Should never be undefined

  return (
    <>
      {!lobbyType ? "Lobby" : <h2 className="fs-1">{ lobbyType?.charAt(0).toUpperCase() + lobbyType?.slice(1) } Match</h2>}

      <LobbyRoom />
    </>
  )
}