import "./style.css";
import "./swing-animation.css";
import React, { useState } from "react";
import { ATTACK_TYPES, PLAYER_TYPES, ROUND_RESULT } from "../../utils/enums";
import { useAppSelector } from "../../redux/hooks";
import AttackSelection from "../AttackSelection";
import { DB_DOC_KEYS, LOBBY_KEYS } from "../../utils/db-keys";
import { updateUserAttack } from "../../utils/rtdb";
import { off, onValue, ref } from "firebase/database";
import { db } from "../../../firebase";

export default function OnlineMatch({ lobbyType, lobbyInfo }: OnlineMatch) {
  const roundCountMax = 5;
  const roundMajority = Math.ceil(roundCountMax); // Amount of rounds needed to win

  const user = useAppSelector(state => state.user);

  const [userAttackStr, setUserAttack] = useState<string>("Waiting...");
  const [opponentAttackStr, setOpponentAttack] = useState<string>("Waiting...");

  const [roundCount, setRoundCount] = useState<number>(1);
  const [roundProgress, setRoundProgress] = useState<PLAYER_TYPES[]>(Array.from({ length: roundCountMax }, () => PLAYER_TYPES.OTHER)); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userWins, setUserWins] = useState<number>(0);
  const [opponentWins, setOpponentWins] = useState<number>(0);
  const [matchDraws, setMatchDraws] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<string>("");
  const [roundResult, setRoundResult] = useState<string>("");
  const [isMatchFinished, setIsMatchFinished] = useState<boolean>(false);

  const [isShowingCountdown, setIsShowingCountdown] = useState<boolean>(false);
  const [coundownText, setCountdownText] = useState<string>("");


  /**
   * Listens to the lobby's specific round count document, and waits for the opponent to select an attack.
   * When the opponent makes their attack, the `onValue` will fetch that data, update the user's UI with the attack, and stop listening to the Firebase document to prevent any further updates.
   * 
   */
  const listenForOpponentAttack = async (userAttack: ATTACK_TYPES) => {
    try {
      const lobbyId = lobbyInfo[LOBBY_KEYS.ID];
      const players = lobbyInfo[LOBBY_KEYS.PLAYERS];
      const opponent = Object.keys(players)?.filter(player => player != user.username)[0];

      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${DB_DOC_KEYS.CASUAL}/${lobbyId}/${LOBBY_KEYS.ROUNDS}/${roundCount}/${opponent}`;

      const opponentAttackRef = ref(db, dbRef);

      onValue(opponentAttackRef, async (snapshot) => {
        const value = snapshot.val();

        if (value) {
          // Turn off listener once the opponent's attack is received
          setOpponentAttack(value);
          off(opponentAttackRef, "value");
          const roundResult = decideWinner(userAttack, value);
          await updateMatch(roundResult);
        } else {
          setOpponentAttack("Waiting...");
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
    // console.log("@updatePracticeRound");
    // console.log("result:", result)
    if (roundResult === ROUND_RESULT.DRAW) {
      setMatchDraws(matchDraws + 1);
      return;
    }

    // Use temp variables to see if there'll be a winner
    let updatedUserWins = userWins;
    let updatedOpponentWins = opponentWins;
    const updatedRoundProgress = [...roundProgress];

    // Update the player's win count and update the round progress element
    if (roundResult === ROUND_RESULT.WIN) {
      updatedUserWins++;
      updatedRoundProgress[roundCount - 1] = PLAYER_TYPES.USER;
      setRoundProgress(updatedRoundProgress);
    }
    else if (roundResult === ROUND_RESULT.LOSE) {
      updatedOpponentWins++;
      updatedRoundProgress[roundCount - 1] = PLAYER_TYPES.OPPONENT;
      setRoundProgress(updatedRoundProgress);
    }


    if (updatedUserWins === roundMajority) {
      doCountdown("You win!");

    } else if (updatedOpponentWins === roundMajority) {
      doCountdown("You lost");

    } else if (roundCount + 1 <= roundCountMax) {
      // Only increment round count if there is NO winner
      setRoundCount(roundCount + 1);
    }

    setUserWins(updatedUserWins);
    setOpponentWins(updatedOpponentWins);
  }

  /**
   * 
   * @param winnerText What will be displayed to the user when the match ends
   */
  const doCountdown = (winnerText: string) => {
    // console.log("@doEpicCountdown");
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
        setRoundWinner(winnerText);
      }
    }, countdownInterval);
  }


  // ************** ON CLICK ************** \\

  const onClickAttack = async (userAttack: ATTACK_TYPES) => {
    setUserAttack(userAttack);

    const userAttackObj = {
      [user.username]: userAttack
    }

    await updateUserAttack(lobbyType, lobbyInfo[LOBBY_KEYS.ID], roundCount, userAttackObj);
    await listenForOpponentAttack(userAttack);
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
        <AttackSelection isFinished={isMatchFinished} onClickAttack={onClickAttack} />

        <div className="container-table mb-3">
          <div className="two-column-spacing">
            <h4>You:</h4>
            <h4><b>{userAttackStr}</b></h4>
          </div>

          <div className="two-column-spacing">
            <h4>Opponent:</h4>
            <h4><b>{opponentAttackStr}</b></h4>
          </div>
        </div>

        <hr />

        {renderStats()}
      </>
    )
  }

  const renderStats = () => {
    return (
      <>
        {isShowingCountdown ? null :
          <div id="practice-round-stats" className="container-table">
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
      <h2>Round {roundCount} / {roundCountMax}</h2>
      <div className="round-progress">
        {roundProgress.map((value, index) => (
          renderRoundIcon(value, index)
        ))}
      </div>


      {isShowingCountdown ?
        <>
          <h3 className="countdown-text">{coundownText}</h3>
          <img src="/assets/fist-cross-dictator-bang-svgrepo-com.svg" width={100} className="fist" alt="rock icon" />
        </> :
        renderMatch()
      }
    </>
  )
}

interface OnlineMatch {
  lobbyType: DB_DOC_KEYS;
  lobbyInfo: LobbyInfo;
}