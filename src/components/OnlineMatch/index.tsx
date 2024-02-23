import "./style.css";
import "./swing-animation.css";
import React, { useEffect, useState } from "react";
import { ATTACK_TYPES, PLAYER_TYPES } from "../../utils/enums";
import { useAppSelector } from "../../redux/hooks";
import AttackSelection from "../AttackSelection";
import { DB_DOC_KEYS, LOBBY_KEYS } from "../../utils/db-keys";
import { updateUserAttack } from "../../utils/rtdb";
import { DataSnapshot, off, onValue, ref } from "firebase/database";
import { db } from "../../../firebase";

export default function OnlineMatch({ lobbyType, lobbyInfo }: OnlineMatch) {
  const roundCountMax = 5;
  const roundMajority = Math.ceil(roundCountMax); // Amount of rounds needed to win

  const user = useAppSelector(state => state.user);

  const [userAttack, setUserAttack] = useState<string>("Waiting...");
  const [opponentAttack, setOpponentAttack] = useState<string>("Waiting...");

  const [roundCount, setRoundCount] = useState<number>(1);
  const [roundProgress, setRoundProgress] = useState<PLAYER_TYPES[]>(Array.from({ length: roundCountMax }, () => PLAYER_TYPES.OTHER)); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [userWins, setUserWins] = useState<number>(0);
  const [opponentWins, setOpponentWins] = useState<number>(0);
  const [roundDraw, setRoundDraw] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<string>("");
  const [roundResult, setRoundResult] = useState<string>("");
  const [isMatchFinished, setIsMatchFinished] = useState<boolean>(false);

  const [isShowingCoundtown, setIsShowingCountdown] = useState<boolean>(false);
  const [coundownText, setCountdownText] = useState<string>("");


  const listenForOpponentAttack = async () => {
    try {
      const lobbyId = lobbyInfo[LOBBY_KEYS.ID];
      const players = lobbyInfo[LOBBY_KEYS.PLAYERS];
      const opponent = Object.keys(players)?.filter(player => player != user.username)[0];

      const dbRef = `${DB_DOC_KEYS.LOBBIES}/${DB_DOC_KEYS.CASUAL}/${lobbyId}/${LOBBY_KEYS.ROUNDS}/${roundCount}/${opponent}`;

      const opponentAttackRef = ref(db, dbRef);

      onValue(opponentAttackRef, (snapshot) => {
        const value = snapshot.val();

        if (value) {
          // Turn off listener once the opponent's attack is received
          setOpponentAttack(value);
          off(opponentAttackRef, "value");
        } else {
          setOpponentAttack("Waiting...");
        }
      });

    } catch (error) {
      console.log("Couldn't update user attack");
      console.error(error);
      return "Error";
    }
  }


  // ************** ON CLICK ************** \\

  const onClickAttack = async (userAttack: ATTACK_TYPES) => {
    setUserAttack(userAttack);

    const userAttackObj = {
      [user.username]: userAttack
    }

    await updateUserAttack(lobbyType, lobbyInfo[LOBBY_KEYS.ID], roundCount, userAttackObj);
    await listenForOpponentAttack();
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
            <h4><b>{userAttack}</b></h4>
          </div>

          <div className="two-column-spacing">
            <h4>Opponent:</h4>
            <h4><b>{opponentAttack}</b></h4>
          </div>
        </div>
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


      {isShowingCoundtown ?
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