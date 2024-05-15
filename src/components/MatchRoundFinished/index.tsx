
export default function MatchRoundFinished({ opponentAttackStr, roundWinner, isRoundDraw, isResolvingDraw, onClickRepeatRound, onClickNextRound }: MatchRoundFinished) {

  return (
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
    </>
  )
}

interface MatchRoundFinished {
  opponentAttackStr: string;
  roundWinner: string;
  isRoundDraw: boolean;
  isResolvingDraw: boolean;
  onClickRepeatRound: React.Dispatch<React.SetStateAction<void>>;
  onClickNextRound: React.Dispatch<React.SetStateAction<void>>;
}