
export default function MatchStats({ userAttackStr, opponentAttackStr, userRoundWins, opponentRoundWins, matchDraws }: MatchStats) {

  return (
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
        <h4><b>{userRoundWins}</b></h4>
      </div>
      <div className="two-column-spacing">
        <h4>Losses:</h4>
        <h4><b>{opponentRoundWins}</b></h4>
      </div>
      <div className="two-column-spacing">
        <h4>Draws:</h4>
        <h4><b>{matchDraws}</b></h4>
      </div>
      <div className="two-column-spacing">
        <h4>Total rounds:</h4>
        <h4><b>{userRoundWins + opponentRoundWins + matchDraws}</b></h4>
      </div>
    </div>
  )
}

interface MatchStats {
  userAttackStr: string;
  opponentAttackStr: string;
  userRoundWins: number;
  opponentRoundWins: number;
  matchDraws: number;
}