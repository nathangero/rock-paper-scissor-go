import "./style.css";
import { useAppSelector } from "../../redux/hooks";
import { useState } from "react";

export default function LobbyRoom() {
  
  const lobby = useAppSelector(state => state.lobby);
  const user = useAppSelector(state => state.user);

  return (
    <>
      Lobby Room

      <div>

      </div>
    </>
  )
}