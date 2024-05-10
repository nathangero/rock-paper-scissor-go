import { LOBBY_TYPES } from "../../utils/enums";

export default function MatchFinished({ lobbyType, matchWinner, rankedMatchWinner, rankedPointChange, isRankedMatchFinished, isWaitingForRematch, onClickLeave, onClickRematch }: MatchFinished) {

  return (
    <>
      {isRankedMatchFinished ?
        <h3 className="match-end-text">{rankedMatchWinner}</h3> :
        <h3 className="match-end-text">{matchWinner}</h3>
      }

      <div className="d-flex justify-content-center">

        {isWaitingForRematch ?
          <div className="d-flex flex-column">
            <h3>Waiting for opponent's response...</h3>
            {lobbyType === LOBBY_TYPES.RANKED ? <br /> :
              <button className="btn button-negative m-2" onClick={() => onClickLeave()}>Leave</button>
            }
          </div> :
          <>

            {lobbyType === LOBBY_TYPES.RANKED ?
              <>
                {isRankedMatchFinished ?
                  <>
                    <div className="d-flex flex-column">
                      <h3>{rankedPointChange}</h3>
                      <button className="btn button-negative m-2" onClick={() => onClickLeave()}>Leave</button>
                    </div>
                  </> : // Only show rematch button in unfinished ranked match
                  <button className="btn button-positive m-2 fs-5" onClick={() => onClickRematch()}>REMATCH</button>
                }
              </> : // Allow infinite rematching outside of ranked matches
              <>
                <button className="btn button-negative m-2" onClick={() => onClickLeave()}>Leave</button>
                <button className="btn button-positive m-2 fs-5" onClick={() => onClickRematch()}>REMATCH</button>
              </>
            }
          </>
        }
      </div>
    </>
  )
}

interface MatchFinished {
  lobbyType: LOBBY_TYPES;
  matchWinner: string;
  rankedMatchWinner: string;
  rankedPointChange: string;
  isRankedMatchFinished: boolean;
  isWaitingForRematch: boolean;
  onClickLeave: React.Dispatch<React.SetStateAction<void>>;
  onClickRematch: React.Dispatch<React.SetStateAction<void>>;
}