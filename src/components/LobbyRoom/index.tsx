import "./style.css";
import { useAppSelector } from "../../redux/hooks";
import { useEffect, useState } from "react";
import {  LOBBY_KEYS } from "../../utils/db-keys";
import { LOBBY_TYPES, ROUTER_LINKS } from "../../utils/enums";
import { Modal } from "bootstrap";
import OnlineMatch from "../OnlineMatch";

export default function LobbyRoom() {

  const user = useAppSelector(state => state.user);
  const lobby = useAppSelector(state => state.lobby);


  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");


  useEffect(() => {
    if (!lobby) {
      // Show an alert saying the connection was lost
      const modalError = document.querySelector<HTMLDivElement>(".alert-modal-lost-connection")?.querySelector<HTMLDivElement>("#alertLostConnection");
      if (modalError) new Modal(modalError).show();
      return;
    }

    // Get the player names
    const players = lobby[LOBBY_KEYS.PLAYERS];
    Object.keys(players)?.map((username) => {
      if (username === user.username) setP1("You");
      else setP2(username);
    });
  }, []) 



  const alertModalLostConnection = () => {
    return (
      <>
        <div className="alert-modal-lost-connection">
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 9999 }}>
            <div className="modal fade" id="alertLostConnection" tabIndex={-1} aria-labelledby="alertModalLabel" aria-hidden="false">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Connection Error</h5>
                  </div>
                  <div className="modal-body custom-modal-body">
                    <p className="modal-title text-center fs-5">
                      Lost connection to lobby. Return to the Home page to find a new one.
                    </p>
                  </div>
                  <div className="modal-body text-end">
                    <button type="button" className="btn button-negative" data-bs-dismiss="modal" onClick={() => window.location.href = ROUTER_LINKS.HOME}>Go Back</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div>
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
        <hr />

        <OnlineMatch lobbyType={LOBBY_TYPES.CASUAL} lobbyInfo={lobby}  />
      </div>

      {alertModalLostConnection()}
    </>
  )
}