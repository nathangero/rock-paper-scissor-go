import "./style.css";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { useEffect, useState } from "react";
import { DB_DOC_KEYS, LOBBY_KEYS } from "../../utils/db-keys";
import { LOBBY_TYPES, ROUTER_LINKS } from "../../utils/enums";
import { Modal } from "bootstrap";
import OnlineMatch from "../OnlineMatch";
import { off, onValue, ref } from "firebase/database";
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
  const [alertButton, setAlertButton] = useState<CustomButton>({});

  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");
  const [players, setPlayers] = useState<object>({});

  useEffect(() => {
    if (!lobby) {
      // Show an alert saying the connection was lost
      const modalError = document.querySelector<HTMLDivElement>(".alert-modal-lost-connection")?.querySelector<HTMLDivElement>("#alertLostConnection");
      if (modalError) new Modal(modalError).show();
      return;
    }


    const modalLeave = document.querySelector<HTMLDivElement>(".alert-modal-lobby-room")?.querySelector<HTMLDivElement>("#alertModal");
    setAlertTitle(p2 ? "Forfeit Match" : "Leave Match");
    setAlertBody("Are you sure you want to leave the match?");
    setAlertButton({ buttonColor: "button-negative", buttonText: "Yes", onClickAction: () => onClickLeaveMatch() });

    if (modalLeave) setAlertModal(new Modal(modalLeave));

    // Get the player names
    const players = lobby[LOBBY_KEYS.PLAYERS];
    if (Object.keys(players).length === 1) {
      listenForOpponentJoin(lobby[LOBBY_KEYS.TYPE], lobby[LOBBY_KEYS.ID]);
    }

    Object.keys(players)?.map((username) => {
      if (username === user.username) setP1("You");
      else setP2(username);
    });

    setPlayers(players);
  }, []);



  const listenForOpponentJoin = async (lobbyType: LOBBY_TYPES, lobbyId: string) => {
    try {
      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.PLAYERS}`;
      const opponentRef = ref(db, dbRef);

      onValue(opponentRef, async (snapshot) => {
        // console.log("@listenForOpponentJoin");
        const players = snapshot.val();
        // console.log("lobby players:", players);

        if (!players) return;

        // Don't stop listening if only 1 player is in the lobby
        if (Object.keys(players).length < 2) return;

        const newOpponent = Object.keys(players)?.filter(player => player != user.username)[0];
        setP2(newOpponent);
        // console.log("found opponent:", newOpponent);

        // Turn off listener once an opponent has joined.
        off(opponentRef, "value");
        // console.log("stop listening to new opponents");

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


  const onClickLeaveMatch = async () => {
    try {
      await dbLeaveLobby(lobby[LOBBY_KEYS.TYPE], lobby[LOBBY_KEYS.ID], user.username);
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
            <h3><b>{p1}</b></h3>
          </div>
          <div>
            <h3>P2</h3>
            <h3><b>{p2}</b></h3>
          </div>
        </div>
        <hr />

        {p2 ?
          <OnlineMatch lobbyType={LOBBY_TYPES.CASUAL} lobbyInfo={lobby} /> :
          <h4>Waiting for an opponent...</h4>
        }

        <br /><br /><br />
        <button className="btn button-negative" onClick={() => alertModal?.show()}>{p2 ? "Forfeit Match" : "Leave Match"}</button>

      </div>

      {alertModalLostConnection()}

      <div className="alert-modal-lobby-room">
        <Alert title={alertTitle} body={alertBody} customButton={alertButton} />
      </div>
    </>
  )
}