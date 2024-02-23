import "./style.css";
import { useAppSelector } from "../../redux/hooks";
import { useEffect, useState } from "react";
import { LOBBY_KEYS } from "../../utils/db-keys";

export default function LobbyRoom() {

  const lobby = useAppSelector(state => state.lobby);
  const user = useAppSelector(state => state.user);

  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");

  useEffect(() => {
    const players = lobby[LOBBY_KEYS.PLAYERS];
    Object.keys(players).map((username) => {
      if (username === user.username) setP1("You");
      else setP2(username);
    })
  }, [])

  return (
    <>
      <div className="players">
        <div>
          <h3>P1</h3>
          <h3><b>{p1}</b></h3>
        </div>
        <div>
          <h3>P2</h3>
          <h3><b>{p2}</b></h3>
        </div>
      </div>
    </>
  )
}