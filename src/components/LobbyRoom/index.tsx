import "./style.css";
import { useAppSelector } from "../../redux/hooks";
import { useEffect, useState } from "react";
import { DB_DOC_KEYS, LOBBY_KEYS } from "../../utils/db-keys";
import { ATTACK_TYPES, PLAYER_TYPES, ROUTER_LINKS } from "../../utils/enums";
import { Modal } from "bootstrap";
import Round from "../Round";
import { updateUserAttack } from "../../utils/rtdb";

export default function LobbyRoom() {
  const roundCountMax = 5;
  const roundMajority = Math.ceil(roundCountMax); // Amount of rounds needed to win

  const user = useAppSelector(state => state.user);
  const lobby = useAppSelector(state => state.lobby);


  const [p1, setP1] = useState<string>("");
  const [p2, setP2] = useState<string>("");
  const [isMatchFinished, setIsMatchFinished] = useState<boolean>(false);
  const [userAttack, setUserAttack] = useState<string>("Waiting...");
  const [opponentAttack, setOpponentAttack] = useState<string>("Waiting...");
  const [roundCount, setRoundCount] = useState<number>(0);
  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [roundDraw, setRoundDraw] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<string>("");
  const [roundResult, setRoundResult] = useState<string>("");
  const [roundProgress, setRoundProgress] = useState<any>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [isShowingCoundtown, setIsShowingCountdown] = useState<boolean>(false);
  const [coundownText, setCountdownText] = useState<string>("");

  useEffect(() => {
    if (!lobby) {
      // Show an alert saying the connection was lost
      const modalError = document.querySelector<HTMLDivElement>(".alert-modal-lost-connection")?.querySelector<HTMLDivElement>("#alertLostConnection");
      if (modalError) new Modal(modalError).show();
      return;
    }

    const players = lobby[LOBBY_KEYS.PLAYERS];
    Object.keys(players)?.map((username) => {
      if (username === user.username) setP1("You");
      else setP2(username);
    });

    setRoundProgress(Array.from({ length: roundCountMax }, () => PLAYER_TYPES.OTHER));
  }, [])

  const listenForOpponentAttack = () => {

  }

  const decideWinner = () => {

  }


  // ************** ON CLICK ************** \\

  const onClickAttack = async (userAttack: ATTACK_TYPES) => {
    setUserAttack(userAttack);

    const userAttackObj = {
      [user.username]: userAttack
    }

    await updateUserAttack(DB_DOC_KEYS.CASUAL, lobby[LOBBY_KEYS.ID], roundCount, userAttackObj);
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

        {isShowingCoundtown ?
          <>
            <h3 className="countdown-text">{coundownText}</h3>
            <img src="assets/fist-cross-dictator-bang-svgrepo-com.svg" width={100} className="fist" alt="rock icon" />
          </> :
          <>
            <Round roundCount={roundCount + 1} roundMax={roundCountMax} roundProgress={roundProgress} isFinished={isMatchFinished} onClickAttack={onClickAttack} />

            <div className="container-table mb-3">
              <div className="two-column-spacing">
                <h4>You:</h4>
                <h4><b>{userAttack}</b></h4>
              </div>

              <div className="two-column-spacing">
                <h4>Opponent:</h4>
                <h4><b>{opponentAttack}</b></h4>
              </div>
            </div>
          </>

        }
      </div>

      {alertModalLostConnection()}
    </>
  )
}