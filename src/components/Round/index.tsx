import "./style.css";
import { ATTACK_TYPES, PLAYER_TYPES } from "../../utils/enums";
import AttackSelection from "../AttackSelection";
import React from "react";

export default function Round({ roundCount, roundMax, roundProgress, onClickAttack }: Round) {

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

  return (
    <>
      <h2>Round {roundCount} / {roundMax}</h2>
      <div className="round-progress">
        {roundProgress?.map((value, index) => (
          renderRoundIcon(value, index)
        ))}
      </div>
      <AttackSelection onClickAttack={onClickAttack} />
    </>
  )
}

interface Round {
  roundCount: number;
  roundMax: number;
  roundProgress: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  onClickAttack: (attackType: ATTACK_TYPES) => void;
}