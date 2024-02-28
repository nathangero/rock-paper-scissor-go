import "./style.css";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { useEffect, useState } from "react";
import { DB_DOC_KEYS, LOBBY_KEYS } from "../../utils/db-keys";
import { LOBBY_TYPES, LOCAL_STORAGE_KEYS, ROUTER_LINKS } from "../../utils/enums";
import { Modal } from "bootstrap";
import OnlineMatch from "../OnlineMatch";
import { onValue, ref } from "firebase/database";
import { db } from "../../../firebase";
import { USER_ACTIONS } from "../../redux/reducer";
import { dbLeaveLobby } from "../../utils/rtdb";
import Alert, { CustomButton } from "../Alert";

export default function LobbyRoom() {

  const user = useAppSelector(state => state.user);
  const lobby = useAppSelector(state => state.lobby);
  const dispatch = useAppDispatch();

  const [alertModal, setAlertModal] = useState<Modal | null>(null);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertBody, setAlertBody] = useState<string>("");
  const [alertButton, setAlertButton] = useState<CustomButton | null>(null);

  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");

  const [isMatchFinished, setIsMatchFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!lobby) {
      handleNoLobbyInfo();
      // Show an alert saying the connection was lost
      const modalError = document.querySelector<HTMLDivElement>(".alert-modal-lost-connection")?.querySelector<HTMLDivElement>("#alertLostConnection");
      if (modalError) new Modal(modalError).show();
      return;
    }


    const modalLeave = document.querySelector<HTMLDivElement>(".alert-modal-lobby-room")?.querySelector<HTMLDivElement>("#alertModal");
    if (modalLeave) setAlertModal(new Modal(modalLeave));

    // Get the player names
    const players = lobby[LOBBY_KEYS.PLAYERS];
    Object.keys(players)?.map((username) => {
      if (username === user.username) setP1("You");
      else setP2(username);
    });

    // Always listen for opponent status for joining and leaving
    listenForOpponentStatus(lobby[LOBBY_KEYS.TYPE], lobby[LOBBY_KEYS.ID]);
  }, []);

  useEffect(() => {
    // show the alert if the title was changed. Need to call the alert on this main thread.
    if (alertTitle) alertModal?.show();
  }, [alertTitle])


  const handleNoLobbyInfo = async () => {
    try {
      const storage = localStorage.getItem(LOCAL_STORAGE_KEYS.LOBBY);
      if (!storage) return;

      const lobbyStorage = JSON.parse(storage);
      await dbLeaveLobby(lobbyStorage[LOBBY_KEYS.TYPE], lobbyStorage[LOBBY_KEYS.ID], user.username);

      // Remove the local storage item after the user leaves the lobby
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LOBBY);
      window.location.href = ROUTER_LINKS.HOME;
    } catch (error) {
      console.log("Couldn't leave match");
      console.error(error);
    }
  }


  const listenForOpponentStatus = (lobbyType: LOBBY_TYPES, lobbyId: string) => {
    try {
      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.PLAYERS}`;
      const opponentRef = ref(db, dbRef);

      onValue(opponentRef, async (snapshot) => {
        // console.log("@listenForOpponentStatus");
        const players = snapshot.val();
        // console.log("lobby players:", players);

        // Null check
        if (!players) return;

        const newOpponent = Object.keys(players)?.filter(player => player != user.username)[0];
        // console.log("found opponent?:", newOpponent);

        // Get p2's name since using p2 state variable doesn't work in this listener thread.
        const p2Name = document.getElementById("player-2-name")?.lastChild?.textContent;
        // console.log("p2Name:", p2Name);

        if (newOpponent) {
          // If there's a new opponent, set their name
          setP2(newOpponent);

        } else if (!newOpponent && p2Name) {
          // If the opponent was in the lobby but then left, then notify the user
          setP2("");
          setAlertTitle("Opponent has left the match");
          setAlertBody("Waiting for another opponent to join");
          setAlertButton(null);
        }

        // Update the lobby in the store so OnlineMatch component will update too
        const updatedLobby = { ...lobby, [LOBBY_KEYS.PLAYERS]: players, [LOBBY_KEYS.PLAYERS_NUM]: Object.keys(players).length };

        dispatch({
          type: USER_ACTIONS.JOIN_LOBBY,
          lobby: updatedLobby,
        });
      });

    } catch (error) {
      console.log("Couldn't update user attack");
      console.error(error);
    }
  }

  const onClickLeaveMatch = () => {
    setAlertTitle(p2 ? "Forfeit Match" : "Leave Match");
    setAlertBody("Are you sure you want to leave the match?");
    setAlertButton({ buttonColor: "button-negative", buttonText: "Yes", onClickAction: () => onConfirmLeaveMatch() });
    alertModal?.show();
  }

  const onConfirmLeaveMatch = async () => {
    try {
      await dbLeaveLobby(lobby[LOBBY_KEYS.TYPE], lobby[LOBBY_KEYS.ID], user.username);

      // Remove the local storage item after the user leaves the lobby
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LOBBY);
      window.location.href = ROUTER_LINKS.HOME;
    } catch (error) {
      console.log("Couldn't leave match");
      console.error(error);
      window.location.href = ROUTER_LINKS.HOME;
    }
  }


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
            <h3 id="player-1-name"><b>{p1}</b></h3>
          </div>
          <div>
            <h3>P2</h3>
            <h3 id="player-2-name"><b>{p2}</b></h3>
          </div>
        </div>
        <hr />

        {p2 ?
          <OnlineMatch lobbyType={LOBBY_TYPES.CASUAL} lobbyInfo={lobby} isMatchFinished={isMatchFinished} setIsMatchFinished={setIsMatchFinished} /> :
          <h4>Waiting for an opponent...</h4>
        }

        <br /><br /><br />
        {isMatchFinished ? null :
          <button className="btn button-negative" onClick={() => onClickLeaveMatch()}>{p2 ? "Forfeit Match" : "Leave Match"}</button>
        }

      </div>

      {alertModalLostConnection()}

      <div className="alert-modal-lobby-room">
        <Alert title={alertTitle} body={alertBody} customButton={alertButton} />
      </div>
    </>
  )
}