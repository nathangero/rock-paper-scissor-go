import "./style.css";
import "../../animations/swing-animation.css";
import React, { useEffect, useState } from "react";
import { ATTACK_TYPES, LOBBY_TYPES, LOCAL_STORAGE_KEYS, PLAYER_TYPES, ROUND_RESULT, ROUTER_LINKS } from "../../utils/enums";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { DB_DOC_KEYS, LOBBY_KEYS, STATS_KEYS } from "../../utils/db-keys";
import { dbHandleRoundDraw, dbLeaveLobby, dbUpdateMatch, dbUpdateRematch, dbUpdateUserAttack, dbUpdateUserRank, dbUpdateUserStats } from "../../utils/rtdb";
import { off, onValue, ref } from "firebase/database";
import { auth, db } from "../../../firebase";
import AttackSelection from "../AttackSelection";
import { Modal } from "bootstrap";
import Alert, { CustomButton } from "../Alert";
import ShotClock from "../ShotClock";
import { USER_ACTIONS } from "../../redux/reducer";
import { useNavigate } from "react-router-dom";
import MatchStats from "../MatchStats";
import MatchProgressIcon from "../MatchProgressIcon";
import MatchRoundFinished from "../MatchRoundFinished";
import MatchFinished from "../MatchFinished";

export default function OnlineMatch({ lobbyType, lobbyInfo, opponentStats, isMatchFinished, setIsMatchFinished }: OnlineMatch) {
  const ROUND_COUNT_MAX = 5;
  const ROUND_MAJORITY = Math.ceil(ROUND_COUNT_MAX / 2); // Amount of rounds needed to win
  const OPPONENT_AFK_TIME = 22; // Countdown till opponent forfeits. Just in case opponent disconnects without updating the db.
  const RANKED_MATCH_MAX = 5; // Best of 5
  const RANKED_MAJORITY = Math.ceil(RANKED_MATCH_MAX / 2); // Amount of ranked matches needed to win

  const user = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [modalTimeout, setModalTimeout] = useState<Modal | null>(null);
  const [modalLeaveLobby, setModalLeaveLobby] = useState<Modal | null>(null);
  const [alertTitle, setAlertTitle] = useState<string>("");
  const [alertBody, setAlertBody] = useState<string>("");
  const [alertButton, setAlertButton] = useState<CustomButton | null>({});

  const [lobbyId, setLobbyId] = useState<string>("");
  const [opponent, setOpponent] = useState<string>("");

  const [userAttackStr, setUserAttackStr] = useState<string>("");
  const [opponentAttackStr, setOpponentAttackStr] = useState<string>("");
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);
  const [isBetweenRounds, setIsBetweenRounds] = useState<boolean>(false);
  const [isWaitingForRematch, setIsWaitingForRematch] = useState<boolean>(false);

  const [opponentAfkSeconds, setOppAfkSeconds] = useState<number>(OPPONENT_AFK_TIME);
  const [isAfkTimerActive, setIsAfkTimerActive] = useState<boolean>(false);

  const [matchCount, setMatchCount] = useState<number>(0);
  const [roundCount, setRoundCount] = useState<number>(1);
  const [roundProgress, setRoundProgress] = useState<PLAYER_TYPES[]>(Array.from({ length: ROUND_COUNT_MAX }, () => PLAYER_TYPES.OTHER)); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [matchProgress, setMatchProgress] = useState<PLAYER_TYPES[]>(Array.from({ length: RANKED_MATCH_MAX }, () => PLAYER_TYPES.OTHER)); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userRoundWins, setUserRoundWins] = useState<number>(0);
  const [opponentRoundWins, setOpponentRoundWins] = useState<number>(0);
  const [userMatchWins, setUserMatchWins] = useState<number>(0);
  const [opponentMatchWins, setOpponentMatchWins] = useState<number>(0);
  const [matchDraws, setMatchDraws] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<string>("");
  const [matchWinner, setMatchWinner] = useState<string>("");
  const [rankedMatchWinner, setRankedMatchWinner] = useState<string>("");
  const [rankedPointChange, setRankedPointChange] = useState<string>("");

  const [isRoundDraw, setIsRoundDraw] = useState<boolean>(false);
  const [isResolvingDraw, setIsResolvingDraw] = useState<boolean>(false);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const [isRankedMatchFinished, setIsRankedMatchFinished] = useState<boolean>(false);

  const [rockCount, setRockCount] = useState<number>(0);
  const [paperCount, setPaperCount] = useState<number>(0);
  const [scissorCount, setScissorCount] = useState<number>(0);

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

    const modalTimeout = document.querySelector<HTMLDivElement>(".alert-modal-timeout")?.querySelector<HTMLDivElement>("#alertModal");
    if (modalTimeout) setModalTimeout(new Modal(modalTimeout));
  }, []);

  // Have a running timer for the opponent that will kick this 
  useEffect(() => {
    // return; // DEBUG
    if (!lobbyInfo) return;
    let timer: NodeJS.Timeout;

    if (!isAfkTimerActive) {
      // console.log("afk timer stopped, starting again with", OPPONENT_AFK_TIME, "seconds")
      setOppAfkSeconds(OPPONENT_AFK_TIME); // Reset the time limit when timer is stopped

      // Instantly start the timer again after resetting its value
      setIsAfkTimerActive(true);
      return;
    }

    // countdown the afk timer for as long as the match is still going
    if (opponentAfkSeconds > 0 && !isMatchFinished) {
      timer = setTimeout(() => {
        setOppAfkSeconds(opponentAfkSeconds - 1);
        // console.log("opponent kick in", opponentAfkSeconds, "seconds");
      }, 1000);
    } else if (opponentAfkSeconds === 0) {
      // console.log("kicking opponent!");
      onTimeout(opponent);
    }

    return () => clearTimeout(timer);
  }, [opponentAfkSeconds, isAfkTimerActive, isMatchFinished]);


  /**
   * Listens to the lobby's specific round count document, and waits for the opponent to select an attack.
   * When the opponent makes their attack, the `onValue` will fetch that data, update the user's UI with the attack, and stop listening to the Firebase document to prevent any further updates.
   * 
   */
  const listenForOpponentAttack = async (userAttack: ATTACK_TYPES) => {
    try {
      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}/${opponent}`;

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
      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}`;

      const roundRef = ref(db, dbRef);

      onValue(roundRef, async (snapshot) => {
        const value = snapshot.val();

        if (!value) {
          // console.log("draw resolved");
          // Turn off listener once the round has been reset
          off(roundRef, "value");

          // Set the appropriate flags to false to continue the game
          setIsResolvingDraw(false);
          setIsRoundFinished(false);
          setIsRoundDraw(false);

          setIsBetweenRounds(false);
          setIsTimerActive(false);
          setTimeout(() => {
            setIsTimerActive(true);
          }, 500);
        }
      });

    } catch (error) {
      console.log("Couldn't update user attack");
      console.error(error);
    }
  }


  const listenForRematch = async () => {
    try {
      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.REMATCH}`;

      const rematchRef = ref(db, dbRef);

      onValue(rematchRef, async (snapshot) => {
        const value = snapshot.val();

        if (!value) return; // Return if null

        if (!value[opponent]) return; // Return if no opponent yet

        const willRematch = value[opponent];
        // console.log("opponent rematch?", willRematch);

        // Turn off listener once opponent response is received
        off(rematchRef, "value");
        setIsWaitingForRematch(false);

        if (willRematch) onConfirmRematch();

      });

    } catch (error) {
      console.log("Couldn't listen to rematch");
      console.error(error);
    }
  }

  /**
   * Update the proper attack count depending on the user's attack.
   * 
   * These "counts" will be used later when the match is finished to update the user's profile
   * @param userAttack The user's selected attack
   */
  const calcAttackStat = (userAttack: ATTACK_TYPES) => {
    switch (userAttack) {
      case ATTACK_TYPES.PAPER:
        setPaperCount(paperCount + 1);
        break;
      case ATTACK_TYPES.ROCK:
        setRockCount(rockCount + 1);
        break;
      case ATTACK_TYPES.SCISSORS:
        setScissorCount(scissorCount + 1);
        break;
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

    setIsBetweenRounds(true);
    if (roundResult === ROUND_RESULT.DRAW) {
      setMatchDraws(matchDraws + 1);
      setIsTimerActive(false);
      setIsTimerActive(true)
      // setTimeout(() => setIsTimerActive(true), 500);
      setIsRoundDraw(true);
      setRoundWinner(`Draw! Repeat round ${roundCount}`);
      return;
    }

    // Use temp variables to see if there'll be a winner
    let updatedUserWins = userRoundWins;
    let updatedOpponentWins = opponentRoundWins;
    const updatedRoundProgress = [...roundProgress];

    // Update the player's win count and update the round progress element
    if (roundResult === ROUND_RESULT.WIN) {
      const roundWinner = {
        [LOBBY_KEYS.WINNER]: user.username
      }
      await dbUpdateMatch(lobbyType, lobbyId, matchCount, roundCount, roundWinner);

      updatedUserWins++;
      updatedRoundProgress[roundCount - 1] = PLAYER_TYPES.USER;
      setRoundProgress(updatedRoundProgress);

      setRoundWinner(`You won round ${roundCount}`);
    }
    else if (roundResult === ROUND_RESULT.LOSE) {
      const roundWinner = {
        [LOBBY_KEYS.WINNER]: opponent
      }
      await dbUpdateMatch(lobbyType, lobbyId, matchCount, roundCount, roundWinner);

      updatedOpponentWins++;
      updatedRoundProgress[roundCount - 1] = PLAYER_TYPES.OPPONENT;
      setRoundProgress(updatedRoundProgress);

      setRoundWinner(`You lost round ${roundCount}`);
    }

    if (updatedUserWins === ROUND_MAJORITY) {
      if (lobbyType === LOBBY_TYPES.RANKED) await updateRankedMatch(true);
      doCountdown(true);

    } else if (updatedOpponentWins === ROUND_MAJORITY) {
      if (lobbyType === LOBBY_TYPES.RANKED) await updateRankedMatch(false);
      doCountdown(false);

    } else {
      setIsTimerActive(true);
    }

    setUserRoundWins(updatedUserWins);
    setOpponentRoundWins(updatedOpponentWins);
  }


  const updateRankedMatch = async (didUserWin: boolean) => {
    // Use temp variables to see if there'll be a winner
    let updatedUserWins = userMatchWins;
    let updatedOpponentWins = opponentMatchWins;
    const updatedMatchProgress = [...matchProgress];

    if (didUserWin) {
      updatedUserWins++;
      updatedMatchProgress[matchCount] = PLAYER_TYPES.USER;
      setMatchProgress(updatedMatchProgress);

      setMatchWinner(`You won match ${matchCount + 1}`);
    } else {
      updatedOpponentWins++;
      updatedMatchProgress[matchCount] = PLAYER_TYPES.OPPONENT;
      setMatchProgress(updatedMatchProgress);

      setMatchWinner(`You lost match ${matchCount + 1}`);
    }

    if (updatedUserWins === RANKED_MAJORITY || updatedOpponentWins === RANKED_MAJORITY) {
      setRankedMatchWinner(didUserWin ? "** You win! **" : "You lost")
      setIsRankedMatchFinished(true);
      if (auth.currentUser?.uid) {
        const pointChanges = await dbUpdateUserRank(lobbyType, auth.currentUser.uid, opponentStats[STATS_KEYS.RP], didUserWin);
        if (pointChanges[1]) setRankedPointChange(`RP: ${pointChanges[0]} → ${pointChanges[1]}`);
        else setRankedPointChange("Couldn't update points, please contact dev");
      }

      // Update the url for the ranked game
      navigate(`${lobbyType}${ROUTER_LINKS.FINISHED}`, { replace: true });
    }

    setUserMatchWins(updatedUserWins);
    setOpponentMatchWins(updatedOpponentWins);
  }


  /**
   * Run a countdown that will show the user text indicating the end of a match
   * @param didUserWin Determines if the user won the match or not.
   */
  const doCountdown = async (didUserWin: boolean) => {
    const countdownInterval = 400;
    const text = ["SCISSORS", "PAPER", "ROCK"];
    let countdown = text.length;

    setIsShowingCountdown(true);
    setIsMatchFinished(true);
    setIsBetweenRounds(false);
    setIsTimerActive(false);

    // Update the url if game is not ranked.
    if (lobbyType !== LOBBY_TYPES.RANKED) navigate(`${lobbyType}${ROUTER_LINKS.FINISHED}`, { replace: true });

    // Only update stats for logged in users
    if (auth.currentUser?.uid) await dbUpdateUserStats(lobbyType, auth.currentUser.uid, rockCount, paperCount, scissorCount, didUserWin);

    const timer = setInterval(() => {
      setCountdownText(text[--countdown]);
      if (countdown < 0) {
        clearInterval(timer);
        setIsShowingCountdown(false);
        setMatchWinner(didUserWin ? "** You win! **" : "You lost");
        if (lobbyType === LOBBY_TYPES.RANKED && !isRankedMatchFinished) {
          // Keep the shot clock going in between ranked matches to prevent players from never rematching
          setIsTimerActive(true);
        }
      }
    }, countdownInterval);
  }

  /**
   * Executes when the `ShotClock` runs out. 
   * 
   * If the opponent's username is given, then that means they were afk. So remove them from the lobby.
   * 
   * @param opponentName Opponent's username if the afk timer triggered
   * @param alertModalClass Specific alert modal to show
   */
  const onTimeout = async (opponentName?: string) => {
    try {
      // If this is a ranked match and the user (not opponent) timed out, penalize their ranked points
      if (lobbyType === LOBBY_TYPES.RANKED && !opponentName) {
        if (auth.currentUser?.uid) await dbUpdateUserRank(lobbyType, auth.currentUser.uid, opponentStats[STATS_KEYS.RP], false);
      }
      await dbLeaveLobby(lobbyType, lobbyInfo[LOBBY_KEYS.ID], opponentName || user.username);

      // Remove the local storage item after the user leaves the lobby
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LOBBY);

      if (opponentName) return; // Don't show modal if kicking the opponent from the lobby;
      modalTimeout?.show();
    } catch (error) {
      console.log("Couldn't leave lobby upon timeout");
      console.error(error);
    }
  }


  // ************** ON CLICK ************** \\

  const onClickAttack = async (userAttack: ATTACK_TYPES) => {
    setUserAttackStr(userAttack);
    calcAttackStat(userAttack);
    setIsBetweenRounds(true);
    setIsTimerActive(false); // Stop the timer
    setIsAfkTimerActive(false);

    const userAttackObj = {
      [user.username]: userAttack
    }

    setIsRoundFinished(true);
    await dbUpdateUserAttack(lobbyType, lobbyInfo[LOBBY_KEYS.ID], matchCount, roundCount, userAttackObj);
    await listenForOpponentAttack(userAttack);
  }

  const onClickRepeatRound = async () => {
    await dbHandleRoundDraw(lobbyType, lobbyId, matchCount, roundCount, user.username);
    await listenForDrawResolution();
    setIsResolvingDraw(true);
    setIsAfkTimerActive(false);
    setRoundWinner("");
    setUserAttackStr("");
    setOpponentAttackStr("");
    setRoundWinner("");
    setIsBetweenRounds(false);
    setIsTimerActive(false);
    setTimeout(() => setIsTimerActive(false), 500);
  }


  const onClickNextRound = () => {
    setIsRoundFinished(false);
    setIsAfkTimerActive(false);
    setRoundCount(roundCount + 1);
    setUserAttackStr("");
    setOpponentAttackStr("");
    setRoundWinner("");
    setIsBetweenRounds(false);
    setIsTimerActive(false);
    // setIsTimerActive(true)
    setTimeout(() => setIsTimerActive(true), 500);
  }

  const onClickRematch = async () => {
    setIsTimerActive(false);
    setIsWaitingForRematch(true);
    await dbUpdateRematch(lobbyType, lobbyId, matchCount, user.username, true);
    await listenForRematch();
  }

  const onConfirmRematch = () => {
    navigate(`${lobbyType}`, { replace: true });
    setMatchCount(matchCount + 1); // Increment the match count
    setIsRoundFinished(false);
    setIsRoundDraw(false);

    setRoundCount(1);
    setRoundProgress(Array.from({ length: ROUND_COUNT_MAX }, () => PLAYER_TYPES.OTHER));
    setUserRoundWins(0);
    setOpponentRoundWins(0);
    setMatchDraws(0);
    setRoundWinner("");
    setMatchWinner("");
    setIsMatchFinished(false);
    setIsRankedMatchFinished(false);
    setIsShowingCountdown(false);
    setCountdownText("");
    setIsTimerActive(true);
    setPaperCount(0);
    setRockCount(0);
    setScissorCount(0);
  }

  const onClickLeave = () => {
    // If the ranked match is over, automatically let the user leave.
    if (lobbyType === LOBBY_TYPES.RANKED && isRankedMatchFinished) {
      onConfirmLeave();
      return;
    }

    setAlertTitle("Leaving the Lobby");
    setAlertBody("Are you sure you want to leave?");
    setAlertButton({
      buttonColor: "button-negative",
      buttonText: "Yes, leave",
      onClickAction: () => onConfirmLeave(),
    });
    modalLeaveLobby?.show();
  }

  const onConfirmLeave = async () => {
    try {
      await dbUpdateRematch(lobbyType, lobbyId, matchCount, user.username, false);
      await dbLeaveLobby(lobbyType, lobbyInfo[LOBBY_KEYS.ID], user.username);

      // Clear the store's lobby to have the navbar reappear
      dispatch({
        type: USER_ACTIONS.LEAVE_LOBBY,
      });

      // Remove the local storage item after the user leaves the lobby
      localStorage.removeItem(LOCAL_STORAGE_KEYS.LOBBY);
      window.location.href = ROUTER_LINKS.HOME;
    } catch (error) {
      console.log("Couldn't leave lobby upon timeout");
      console.error(error);
    }
  }


  const onConfirmTimeout = () => {
    window.location.href = ROUTER_LINKS.HOME;
  }


  // ************** RENDERS ************** \\

  const renderModalTimeout = () => {
    return (
      <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 9999 }}>
        <div className="modal fade" id="alertModal" tabIndex={-1} aria-labelledby="alertModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Kicked for inactivty</h5>
              </div>
              <div className="modal-body custom-modal-body">
                <p className="modal-title text-center fs-5">
                  You'll be returned to the Main Menu
                </p>
              </div>
              <div className="modal-body text-end">
                <button type="button" className="btn btn-secondary" onClick={() => onConfirmTimeout()} data-bs-dismiss="modal">Got it</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderModalOppAfkTimeout = () => {
    return (
      <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 9999 }}>
        <div className="modal fade" id="alertModal" tabIndex={-1} aria-labelledby="alertModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Opponent was kicked for inactivty</h5>
              </div>
              <div className="modal-body custom-modal-body">
                <p className="modal-title text-center fs-5">
                  You'll be returned to the Main Menu.
                </p>
              </div>
              <div className="modal-body text-end">
                <button type="button" className="btn btn-secondary" onClick={() => onConfirmTimeout()} data-bs-dismiss="modal">Got it</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  const renderMatch = () => {
    return (
      <>
        {lobbyType === LOBBY_TYPES.RANKED ?
          <>
            <h2>Match {matchCount + 1} / {RANKED_MATCH_MAX}</h2 >
            <div className="round-progress">
              {matchProgress.map((value, index) => (
                <React.Fragment key={index}>
                  <MatchProgressIcon playerType={value} />
                </React.Fragment>
              ))}
            </div>
          </> :
          <>
            <h2>Match {matchCount + 1}</h2>
          </>
        }

        <h2>Round {roundCount} / {ROUND_COUNT_MAX}</h2>
        <div className="round-progress">
          {roundProgress.map((value, index) => (
            <React.Fragment key={index}>
              <MatchProgressIcon playerType={value} />
            </React.Fragment>
          ))}
        </div>

        {isMatchFinished ?
          <>
            {lobbyType === LOBBY_TYPES.RANKED && !isRankedMatchFinished ?
              // Show shot clock on REMATCH screen for ongoing ranked matches
              <ShotClock isActive={isTimerActive} isBetweenRounds={isBetweenRounds} onTimeout={() => onTimeout()} /> : null
            }
            <MatchFinished
              lobbyType={lobbyType}
              matchWinner={matchWinner}
              rankedMatchWinner={rankedMatchWinner}
              rankedPointChange={rankedPointChange}
              isRankedMatchFinished={isRankedMatchFinished}
              isWaitingForRematch={isWaitingForRematch}
              onClickLeave={onClickLeave}
              onClickRematch={onClickRematch}
            />
          </> :
          <>
            <ShotClock isActive={isTimerActive} isBetweenRounds={isBetweenRounds} onTimeout={() => onTimeout()} />
            {isRoundFinished ?
              <MatchRoundFinished
                opponentAttackStr={opponentAttackStr}
                roundWinner={roundWinner}
                isRoundDraw={isRoundDraw}
                isResolvingDraw={isResolvingDraw}
                onClickRepeatRound={onClickRepeatRound}
                onClickNextRound={onClickNextRound}
              /> :
              <AttackSelection onClickAttack={onClickAttack} />
            }
          </>
        }

        {isShowingCountdown ? null :
          <MatchStats
            userAttackStr={userAttackStr}
            opponentAttackStr={opponentAttackStr}
            userRoundWins={userRoundWins}
            opponentRoundWins={opponentRoundWins}
            matchDraws={matchDraws}
          />
        }
      </>
    )
  }

  return (
    <>
      {isShowingCountdown ?
        <>
          <h3 className="countdown-text">{coundownText}</h3>
          <img src="/assets/fist-cross-dictator-bang-svgrepo-com.svg" width={100} className="fist" alt="fist icon" />
        </> :
        renderMatch()
      }


      <div className="alert-modal-leave-lobby">
        <Alert
          title={alertTitle}
          body={alertBody}
          customButton={alertButton}
        />
      </div>

      <div className="alert-modal-timeout">
        {renderModalTimeout()}
      </div>

      <div className="alert-modal-opp-afk">
        {renderModalOppAfkTimeout()}
      </div>
    </>
  )
}

interface OnlineMatch {
  lobbyType: LOBBY_TYPES;
  lobbyInfo: LobbyInfo;
  opponentStats: ProfileInfo;
  isMatchFinished: boolean;
  setIsMatchFinished: React.Dispatch<React.SetStateAction<boolean>>;
}