import "./style.css";
import "./swing-animation.css";
import React, { useEffect, useState } from "react";
import { ATTACK_TYPES, LOBBY_TYPES, LOCAL_STORAGE_KEYS, PLAYER_TYPES, ROUND_RESULT, ROUTER_LINKS } from "../../utils/enums";
import { useAppSelector } from "../../redux/hooks";
import { DB_DOC_KEYS, LOBBY_KEYS } from "../../utils/db-keys";
import { dbHandleRoundDraw, dbLeaveLobby, updateMatchDb, updateUserAttack } from "../../utils/rtdb";
import { off, onValue, ref } from "firebase/database";
import { db } from "../../../firebase";
import AttackSelection from "../AttackSelection";
import { Modal } from "bootstrap";
import Alert from "../Alert";
import ShotClock from "../ShotClock";

export default function OnlineMatch({ lobbyType, lobbyInfo }: OnlineMatch) {
  const roundCountMax = 5;
  const roundMajority = Math.ceil(roundCountMax / 2); // Amount of rounds needed to win
  const roundTimeLimit = 15; // 15 seconds
  const roundBetweenTimeLimit = 7; // The countdown between rounds


  const user = useAppSelector(state => state.user);

  const [modalLeaveLobby, setModalLeaveLobby] = useState<Modal | null>(null);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertBody, setAlertBody] = useState<string>("");

  const [lobbyId, setLobbyId] = useState<string>("");
  const [opponent, setOpponent] = useState<string>("");

  const [userAttackStr, setUserAttackStr] = useState<string>("");
  const [opponentAttackStr, setOpponentAttackStr] = useState<string>("");
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [timeLimit, setTimeLimit] = useState<number>(roundTimeLimit);

  const [matchCount, setMatchCount] = useState<number>(0);
  const [roundCount, setRoundCount] = useState<number>(1);
  const [roundProgress, setRoundProgress] = useState<PLAYER_TYPES[]>(Array.from({ length: roundCountMax }, () => PLAYER_TYPES.OTHER)); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userWins, setUserWins] = useState<number>(0);
  const [opponentWins, setOpponentWins] = useState<number>(0);
  const [matchDraws, setMatchDraws] = useState<number>(0);
  const [isRoundDraw, setIsRoundDraw] = useState<boolean>(false);
  const [isResolvingDraw, setIsResolvingDraw] = useState<boolean>(false);
  const [roundWinner, setRoundWinner] = useState<string>("");
  const [matchWinner, setMatchWinner] = useState<string>("");
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const [isMatchFinished, setIsMatchFinished] = useState<boolean>(false);

  const [isShowingCountdown, setIsShowingCountdown] = useState<boolean>(false);
  const [coundownText, setCountdownText] = useState<string>("");


  useEffect(() => {
    if (!lobbyInfo) return;

    setLobbyId(lobbyInfo[LOBBY_KEYS.ID]);
    const players = lobbyInfo[LOBBY_KEYS.PLAYERS];
    setOpponent(Object.keys(players)?.filter(player => player != user.username)[0]);

    // Set bootstrap modals
    const modalLeave = document.querySelector<HTMLDivElement>(".alert-modal-leave-lobby")?.querySelector<HTMLDivElement>("#alertModal");
    if (modalLeave) setModalLeaveLobby(new Modal(modalLeave));
  }, []);

  useEffect(() => {
    console.log("is timer active?", isTimerActive);
    // if (!isTimerActive) setIsTimerActive(true);
  }, [isTimerActive])


  /**
   * Listens to the lobby's specific round count document, and waits for the opponent to select an attack.
   * When the opponent makes their attack, the `onValue` will fetch that data, update the user's UI with the attack, and stop listening to the Firebase document to prevent any further updates.
   * 
   */
  const listenForOpponentAttack = async (userAttack: ATTACK_TYPES) => {
    try {
      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${LOBBY_TYPES.CASUAL}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}/${opponent}`;

      const opponentAttackRef = ref(db, dbRef);

      onValue(opponentAttackRef, async (snapshot) => {
        const value = snapshot.val();

        if (value) {
          // Turn off listener once the opponent's attack is received
          setOpponentAttackStr(value);
          off(opponentAttackRef, "value");
          const roundResult = decideWinner(userAttack, value);
          await updateMatch(roundResult);
        } else {
          setOpponentAttackStr("");
        }
      });

    } catch (error) {
      console.log("Couldn't update user attack");
      console.error(error);
    }
  }


  /**
   * This sets a listener to the match's round count, and waits for both player's attacks to be deleted from the db. 
   * This makes sure both players don't put attacks ahead of each other in the same round.
   * 
   * This is done to prevent race conditions between both players, where if p1 clicks the "Repeat Round" button and selects an attack before p2 clicks their "Repeat Round" button, p1 won't accidentally read in p2's previous attack.
   */
  const listenForDrawResolution = async () => {
    try {
      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${LOBBY_TYPES.CASUAL}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}`;

      const roundRef = ref(db, dbRef);

      onValue(roundRef, async (snapshot) => {
        const value = snapshot.val();

        if (!value) {

          // Turn off listener once the round has been reset
          off(roundRef, "value");

          // Set the appropriate flags to false to continue the game
          setIsResolvingDraw(false);
          setIsRoundFinished(false);
          setIsRoundDraw(false);
          // setIsTimerActive(false);
        }
      });

    } catch (error) {
      console.log("Couldn't update user attack");
      console.error(error);
    }
  }

  /**
   * Determines if the user won, lost, or had a draw with their opponent.
   * 
   * Pass in the attacks instead of using stateful variables to hopefully prevent any issues.
   * 
   * @param userAttack The user's choice
   * @param opponentAttack The opponent's choice
   * @returns If p1 (the user) won, lost, or had a draw.
   */
  const decideWinner = (userAttack: string, opponentAttack: string) => {
    if (userAttack === opponentAttack) return ROUND_RESULT.DRAW;
    else if (userAttack === ATTACK_TYPES.ROCK && opponentAttack === ATTACK_TYPES.PAPER) return ROUND_RESULT.LOSE;
    else if (userAttack === ATTACK_TYPES.ROCK && opponentAttack === ATTACK_TYPES.SCISSORS) return ROUND_RESULT.WIN;
    else if (userAttack === ATTACK_TYPES.PAPER && opponentAttack === ATTACK_TYPES.SCISSORS) return ROUND_RESULT.LOSE;
    else if (userAttack === ATTACK_TYPES.PAPER && opponentAttack === ATTACK_TYPES.ROCK) return ROUND_RESULT.WIN;
    else if (userAttack === ATTACK_TYPES.SCISSORS && opponentAttack === ATTACK_TYPES.ROCK) return ROUND_RESULT.LOSE;
    else if (userAttack === ATTACK_TYPES.SCISSORS && opponentAttack === ATTACK_TYPES.PAPER) return ROUND_RESULT.WIN;
    else return ROUND_RESULT.DRAW; // Just in case
  }


  const updateMatch = async (roundResult: ROUND_RESULT) => {
    // console.log("@updateMatch");

    setTimeLimit(roundBetweenTimeLimit);

    if (roundResult === ROUND_RESULT.DRAW) {
      setMatchDraws(matchDraws + 1);
      setIsRoundDraw(true);
      setRoundWinner(`Draw! Repeat round ${roundCount}`);
      // setIsTimerActive(false);
      // setIsTimerActive(true);
      // setTimeout(() => { setIsTimerActive(true) }, 500);
      return;
    }

    // Use temp variables to see if there'll be a winner
    let updatedUserWins = userWins;
    let updatedOpponentWins = opponentWins;
    const updatedRoundProgress = [...roundProgress];

    // Update the player's win count and update the round progress element
    if (roundResult === ROUND_RESULT.WIN) {
      const roundWinner = {
        [LOBBY_KEYS.WINNER]: user.username
      }
      await updateMatchDb(lobbyType, lobbyId, matchCount, roundCount, roundWinner);

      updatedUserWins++;
      updatedRoundProgress[roundCount - 1] = PLAYER_TYPES.USER;
      setRoundProgress(updatedRoundProgress);

      setRoundWinner(`You won round ${roundCount}`);
    }
    else if (roundResult === ROUND_RESULT.LOSE) {
      const roundWinner = {
        [LOBBY_KEYS.WINNER]: opponent
      }
      await updateMatchDb(lobbyType, lobbyId, matchCount, roundCount, roundWinner);

      updatedOpponentWins++;
      updatedRoundProgress[roundCount - 1] = PLAYER_TYPES.OPPONENT;
      setRoundProgress(updatedRoundProgress);

      setRoundWinner(`You lost round ${roundCount}`);
    }


    if (updatedUserWins === roundMajority) {
      doCountdown("** You win! **");

    } else if (updatedOpponentWins === roundMajority) {
      doCountdown("You lost");

    }

    setUserWins(updatedUserWins);
    setOpponentWins(updatedOpponentWins);

    console.log("setting timelimit to", roundBetweenTimeLimit);
  }

  /**
   * 
   * @param winnerText What will be displayed to the user when the match ends
   */
  const doCountdown = (winnerText: string) => {
    const countdownInterval = 600;
    const text = ["SCISSORS", "PAPER", "ROCK"];
    let countdown = text.length;

    setIsShowingCountdown(true);
    const timer = setInterval(() => {
      setCountdownText(text[--countdown]);
      setIsMatchFinished(true);
      if (countdown < 0) {
        clearInterval(timer);
        setIsShowingCountdown(false);
        setMatchWinner(winnerText);
      }
    }, countdownInterval);
  }


  const onTimeout = async () => {
    try {
      console.log("player didn't respond, so kicking from lobby");
      await onClickConfirmLeave();

      // Remove the local storage item after the user leaves the lobby
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LOBBY);
      window.location.href = ROUTER_LINKS.HOME;
    } catch (error) {
      console.log("Couldn't leave lobby upon timeout");
      console.error(error);
    }
  }


  // ************** ON CLICK ************** \\

  const onClickAttack = async (userAttack: ATTACK_TYPES) => {
    setUserAttackStr(userAttack);
    setIsTimerActive(false); // Stop the timer

    const userAttackObj = {
      [user.username]: userAttack
    }

    setIsRoundFinished(true);
    await updateUserAttack(lobbyType, lobbyInfo[LOBBY_KEYS.ID], matchCount, roundCount, userAttackObj);
    await listenForOpponentAttack(userAttack);
  }

  const onClickRepeatRound = async () => {
    await dbHandleRoundDraw(lobbyType, lobbyId, matchCount, roundCount, user.username);
    await listenForDrawResolution();
    setIsResolvingDraw(true);
    setRoundWinner("");
    setUserAttackStr("");
    setOpponentAttackStr("");
    setRoundWinner("");
    setTimeLimit(roundTimeLimit);
  }


  const onClickNextRound = () => {
    setIsRoundFinished(false);
    setRoundCount(roundCount + 1);
    setUserAttackStr("");
    setOpponentAttackStr("");
    setRoundWinner("");
    setTimeLimit(roundTimeLimit);
  }

  const onClickLeave = () => {
    setAlertTitle("Leaving the Lobby");
    setAlertBody("Are you sure you want to leave?");
    modalLeaveLobby?.show();
  }

  const onClickConfirmLeave = async () => {
    try {
      await dbLeaveLobby(lobbyType, lobbyInfo[LOBBY_KEYS.ID], user.username);

      // Remove the local storage item after the user leaves the lobby
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LOBBY);
      window.location.href = ROUTER_LINKS.HOME;
    } catch (error) {
      console.log("Couldn't leave lobby upon timeout");
      console.error(error);
    }
  }

  const onClickRematch = () => {
    setMatchCount(matchCount + 1); // Increment the match count
    setIsRoundFinished(false);
    setIsRoundDraw(false);

    setRoundCount(1);
    setRoundProgress(Array.from({ length: roundCountMax }, () => PLAYER_TYPES.OTHER));
    setUserWins(0);
    setOpponentWins(0);
    setMatchDraws(0);
    setIsRoundDraw(false);
    setRoundWinner("");
    setMatchWinner("");
    setIsRoundFinished(false);
    setIsMatchFinished(false);
    setIsShowingCountdown(false);
    setCountdownText("");
  }


  // ************** RENDERS ************** \\

  const renderRoundIcon = (playerType: PLAYER_TYPES, index: number) => {
    return (
      <React.Fragment key={index}>
        {playerType === PLAYER_TYPES.OTHER ?
          <>
            <div className="round-icon">
              <img src="/assets/circle-svgrepo-com.svg" width={30} alt="empty circle icon to show an unfinished round." />
            </div>
          </> :
          <>
            {playerType === PLAYER_TYPES.USER ?
              <div className="round-icon">
                <img src="/assets/crown-solid-svgrepo-com.svg" width={40} alt="crown icon for user winning a round." />
              </div> :
              <div className="round-icon">
                <img src="/assets/circle-close-svgrepo-com.svg" width={40} alt="circle with x icon for user losing a round." />
              </div>
            }
          </>
        }
      </React.Fragment>
    )
  }


  const renderMatch = () => {
    return (
      <>
        <h2>Round {roundCount} / {roundCountMax}</h2>
        <div className="round-progress">
          {roundProgress.map((value, index) => (
            renderRoundIcon(value, index)
          ))}
        </div>


        <ShotClock timeLimit={timeLimit} isActive={isTimerActive} onTimeout={() => onTimeout()} />
        {isMatchFinished ?
          <>
            <h3 className="match-end-text">{matchWinner}</h3>
            <div className="d-flex justify-content-center">

              <button className="btn button-negative m-2" onClick={() => onClickLeave()}>Leave</button>
              <button className="btn button-positive m-2 fs-5" onClick={() => onClickRematch()}>REMATCH</button>
            </div>
          </> :
          <>
            {isRoundFinished ?
              <>
                <h3>{roundWinner}</h3>
                {isRoundDraw ?
                  <>
                    {isResolvingDraw ? <h3>Waiting for opponent...</h3> :
                      <button className="btn button-positive" onClick={() => onClickRepeatRound()}>Repeat Round</button>
                    }
                  </> :
                  <>
                    {isResolvingDraw ? <h3>Waiting for opponent...</h3> :
                      <>
                        {opponentAttackStr ?
                          <button className="btn button-positive" onClick={() => onClickNextRound()}>Next Round</button> :
                          <h3>Waiting for opponent...</h3>
                        }
                      </>
                    }
                  </>
                }
              </> :
              <AttackSelection isFinished={isMatchFinished} onClickAttack={onClickAttack} />
            }
          </>
        }

        {renderStats()}
      </>
    )
  }

  const renderStats = () => {
    return (
      <>
        {isShowingCountdown ? null :
          <div id="casual-round-stats" className="container-table">
            <div className="mb-3">
              <div className="two-column-spacing">
                <h4>You:</h4>
                <h4><b>{userAttackStr || "Waiting..."}</b></h4>
              </div>

              <div className="two-column-spacing">
                <h4>Opponent:</h4>
                <h4><b>{opponentAttackStr || "Waiting..."}</b></h4>
              </div>
            </div>

            <hr />

            <div className="two-column-spacing">
              <h4>Wins:</h4>
              <h4><b>{userWins}</b></h4>
            </div>
            <div className="two-column-spacing">
              <h4>Losses:</h4>
              <h4><b>{opponentWins}</b></h4>
            </div>
            <div className="two-column-spacing">
              <h4>Draws:</h4>
              <h4><b>{matchDraws}</b></h4>
            </div>
            <div className="two-column-spacing">
              <h4>Total rounds:</h4>
              <h4><b>{userWins + opponentWins + matchDraws}</b></h4>
            </div>
          </div>
        }
      </>
    )
  }

  return (
    <>
      {isShowingCountdown ?
        <>
          <h3 className="countdown-text">{coundownText}</h3>
          <img src="/assets/fist-cross-dictator-bang-svgrepo-com.svg" width={100} className="fist" alt="rock icon" />
        </> :
        renderMatch()
      }


      <div className="alert-modal-leave-lobby">
        <Alert
          title={alertTitle}
          body={alertBody}
          customButton={{
            buttonColor: "button-negative",
            buttonText: "Yes, leave",
            onClickAction: () => onClickConfirmLeave(),
          }}
        />
      </div>
    </>
  )
}

interface OnlineMatch {
  lobbyType: LOBBY_TYPES;
  lobbyInfo: LobbyInfo;
}