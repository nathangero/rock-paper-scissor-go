import "./style.css";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { useEffect, useState } from "react";
import { DB_DOC_KEYS, LOBBY_KEYS } from "../../utils/db-keys";
import { LOBBY_TYPES, LOCAL_STORAGE_KEYS, ROUTER_LINKS } from "../../utils/enums";
import { Modal } from "bootstrap";
import OnlineMatch from "../OnlineMatch";
import { off, onValue, ref } from "firebase/database";
import { auth, db } from "../../../firebase";
import { USER_ACTIONS } from "../../redux/reducer";
import { dbLeaveLobby } from "../../utils/rtdb";
import Alert, { CustomButton } from "../Alert";
import { useParams } from "react-router-dom";

export default function LobbyRoom() {

  const user = useAppSelector(state => state.user);
  const lobby = useAppSelector(state => state.lobby);
  const dispatch = useAppDispatch();

  const { lobbyType } = useParams<string>();

  const [alertModal, setAlertModal] = useState<Modal | null>(null);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertBody, setAlertBody] = useState<string>("");
  const [alertButton, setAlertButton] = useState<CustomButton | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const [modalOpponentQuit, setModalOpponentQuit] = useState<Modal | null>(null);
  const [showOppQuitModal, setShowOppQuitModal] = useState<boolean>(false);

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

    const modalOppQuit = document.querySelector<HTMLDivElement>(".alert-modal-opponent-quit")?.querySelector<HTMLDivElement>("#alertOppQuit");
    if (modalOppQuit) setModalOpponentQuit(new Modal(modalOppQuit));


    // Get the player names
    const players = lobby[LOBBY_KEYS.PLAYERS];
    Object.keys(players)?.map((username) => {
      if (username === user.username) setP1("You");
      else setP2(username);
    });



    // Always listen for opponent status for joining and leaving
    listenForOpponentStatus(getLobbyType(), lobby[LOBBY_KEYS.ID]);
  }, []);

  // This allows the modal to be reused within different Firebase listener threads
  useEffect(() => {
    if (showModal) {
      alertModal?.show();
      setShowModal(false); // Set to false so the modal can appear again.
    }
  }, [showModal])

  // This allows the modal to be reused within different Firebase listener threads
  useEffect(() => {
    if (showOppQuitModal) {
      modalOpponentQuit?.show();
      setShowOppQuitModal(false); // Set to false so the modal can appear again.
    }
  }, [showOppQuitModal])


  const getLobbyType = (): LOBBY_TYPES => {
    switch (lobbyType) {
      case LOBBY_TYPES.CASUAL:
        return LOBBY_TYPES.CASUAL;
      case LOBBY_TYPES.PRIVATE:
        return LOBBY_TYPES.PRIVATE;
      case LOBBY_TYPES.RANKED:
        return LOBBY_TYPES.RANKED;
      default:
        return LOBBY_TYPES.CASUAL;
    }
  }

  const handleNoLobbyInfo = async () => {
    try {
      const storage = localStorage.getItem(LOCAL_STORAGE_KEYS.LOBBY);
      if (!storage) return;

      const lobbyStorage = JSON.parse(storage);
      await dbLeaveLobby(getLobbyType(), lobbyStorage[LOBBY_KEYS.ID], user.username);
      // console.log("@handleNoLobbyInfo")
      // console.log("dispatch leave lobby")

      // Clear the store's lobby to have the navbar reappear
      dispatch({
        type: USER_ACTIONS.LEAVE_LOBBY,
      });

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
          console.log("opponent left");
          // If ranked, make the remaining user leave the lobby too
          if (lobbyType === LOBBY_TYPES.RANKED) {
            if (!isMatchFinished) {
              setP2("");
              setShowOppQuitModal(true);
              await onConfirmLeaveMatch(true);
            } else {
              // Turn off the listener if the match is over
              off(opponentRef, "value");
            }
          } else {
            // If the opponent was in the lobby but then left, then notify the user
            setP2("");
            setAlertTitle("Opponent has left the match");
            setAlertBody("Waiting for another opponent to join");
            setAlertButton(null);
            setIsMatchFinished(false);
            setShowModal(true);
          }

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
    const lobbyType = getLobbyType();

    setAlertTitle(p2 ? `Forfeit ${lobbyType.charAt(0).toUpperCase() + lobbyType.slice(1)} Match` : "Leave Match");
    if (lobbyType === LOBBY_TYPES.RANKED && p2) {
      // If ranked and has an opponent, show user they'll be penalized
      setAlertBody("Are you sure you want to quit mid-match? You will be penalized.");
      setAlertButton({
        buttonColor: "button-negative",
        buttonText: "Yes, penalize me",
        onClickAction: () => onConfirmLeaveMatch(),
      });
      alertModal?.show();
    } else {
      setAlertBody("Are you sure you want to leave the match?");
      setAlertButton({ buttonColor: "button-negative", buttonText: "Yes", onClickAction: () => onConfirmLeaveMatch() });
      alertModal?.show();
    }
  }



  /**
   * Remove the user from the lobby in the db.
   * Remove the lobby info from the browser's local storage.
   * 
   * Can decide if the user will be redirected as of this function call or not.
   * @param noForceRedirect If `true`, does NOT force the user to the main menu. If `false`, DOES for the user to the main menu
   */
  const onConfirmLeaveMatch = async (noForceRedirect?: boolean) => {
    try {
      await dbLeaveLobby(getLobbyType(), lobby[LOBBY_KEYS.ID], user.username);

      // Clear the store's lobby to have the navbar reappear
      dispatch({
        type: USER_ACTIONS.LEAVE_LOBBY,
      });

      // Remove the local storage item after the user leaves the lobby
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LOBBY);
      if (!noForceRedirect) window.location.href = ROUTER_LINKS.HOME; // Auto redirect the user if not specifically specified
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


  const alertModalRankedOppQuit = () => {
    return (
      <>
        <div className="alert-modal-opponent-quit">
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 9999 }}>
            <div className="modal fade" id="alertOppQuit" tabIndex={-1} aria-labelledby="alertModalLabel" aria-hidden="false">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Opponent Quit</h5>
                  </div>
                  <div className="modal-body custom-modal-body">
                    <p className="modal-title text-center fs-5">
                      Your opponent has quit. You'll be returned to the Main Menu and not be penalized.
                    </p>
                  </div>
                  <div className="modal-body text-end">
                    <button type="button" className="btn button-negative" data-bs-dismiss="modal" onClick={() => window.location.href = ROUTER_LINKS.HOME}>Got it</button>
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
          <div className="players-names">
            <h3><u>P1</u></h3>
            <h3><u>P2</u></h3>
          </div>
          <div className="players-names">
            <h3 id="player-1-name"><b>{p1}</b></h3>
            <h3 id="player-2-name"><b>{p2}</b></h3>
          </div>
        </div>

        <hr />

        {!lobby ? null :
          <>
            {p2 && lobby ?
              <OnlineMatch lobbyType={getLobbyType()} lobbyInfo={lobby} isMatchFinished={isMatchFinished} setIsMatchFinished={setIsMatchFinished} /> :
              <>
                <h4>Waiting for an opponent...</h4>
                {getLobbyType() === LOBBY_TYPES.PRIVATE ?
                  <>
                    <p className="fs-3">Your lobby code: <b>{lobby[LOBBY_KEYS.ID]}</b></p>
                  </> : null
                }
              </>
            }
          </>
        }

        <br /><br />
        {isMatchFinished ?
          <>
            {auth.currentUser ? null : <p>If you log in, you can keep track of your stats.</p>}
          </> :
          <button className="btn button-negative" onClick={() => onClickLeaveMatch()}>{p2 ? "Forfeit Match" : "Leave Match"}</button>
        }

      </div>

      {alertModalLostConnection()}
      {alertModalRankedOppQuit()}

      <div className="alert-modal-lobby-room">
        <Alert title={alertTitle} body={alertBody} customButton={alertButton} />
      </div>
    </>
  )
}