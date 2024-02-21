import { Link } from "react-router-dom";
import "./style.css";
import { ATTACK_TYPES, ROUND_RESULT } from "../../utils/enums";
import { useState } from "react";

export default function Practice() {

  const [userAttack, setUserAttack] = useState<ATTACK_TYPES>(ATTACK_TYPES.RANDOM);
  const [opponentAttack, setOpponentAttack] = useState<ATTACK_TYPES>(ATTACK_TYPES.RANDOM);
  const [roundResult, setRoundResult] = useState("");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);

  const randomAttack = () => {
    const selection = Math.round(Math.random() * 2);
    // console.log("selection:", selection);
    if (selection === 0) return ATTACK_TYPES.ROCK;
    else if (selection === 1) return ATTACK_TYPES.PAPER;
    else if (selection === 2) return ATTACK_TYPES.SCISSORS;
    else return ATTACK_TYPES.ROCK; // Just in case
  }

  /**
   * Determines if p1 (the user) won, lost, or had a draw with their opponent.
   * 
   * @param p1Attack The user's choice
   * @param p2Attack The opponent's choice
   * @returns If p1 (the user) won, lost, or had a draw.
   */
  const decideWinner = (p1Attack: ATTACK_TYPES, p2Attack: ATTACK_TYPES) => {
    if (p1Attack === p2Attack) return ROUND_RESULT.DRAW;
    else if (p1Attack === ATTACK_TYPES.ROCK && p2Attack === ATTACK_TYPES.PAPER) return ROUND_RESULT.LOSE;
    else if (p1Attack === ATTACK_TYPES.ROCK && p2Attack === ATTACK_TYPES.SCISSORS) return ROUND_RESULT.WIN;
    else if (p1Attack === ATTACK_TYPES.PAPER && p2Attack === ATTACK_TYPES.SCISSORS) return ROUND_RESULT.LOSE;
    else if (p1Attack === ATTACK_TYPES.PAPER && p2Attack === ATTACK_TYPES.ROCK) return ROUND_RESULT.WIN;
    else if (p1Attack === ATTACK_TYPES.SCISSORS && p2Attack === ATTACK_TYPES.ROCK) return ROUND_RESULT.LOSE;
    else if (p1Attack === ATTACK_TYPES.SCISSORS && p2Attack === ATTACK_TYPES.PAPER) return ROUND_RESULT.WIN;
    else return ROUND_RESULT.DRAW; // Just in case
  }

  const calcWinLossRatio = (): string | number => {
    if (wins === 0) return 0;
    else if (wins > 0 && losses === 0) return 100;
    return (wins / losses).toFixed(2);
  }

  const onClickAttack = (userAttack: ATTACK_TYPES) => {
    setUserAttack(userAttack);
    const opponentAttack = randomAttack();
    setOpponentAttack(opponentAttack);
    const result = decideWinner(userAttack, opponentAttack);

    // TODO: Increment win/loss record
    if (result === ROUND_RESULT.DRAW) {
      setRoundResult("Draw! Go Again");
      setDraws(draws + 1);
    }
    else if (result === ROUND_RESULT.WIN) {
      setRoundResult("** You Win! **");
      setWins(wins + 1);
    }
    else if (result === ROUND_RESULT.LOSE) {
      setRoundResult("You Lose");
      setLosses(losses + 1);
    }
  }

  return (
    <section id="mode-practice">
      <div className="">
        <Link
          to={"/"}
          className="btn button-positive"
        >
          <i className="bi bi-arrow-left"></i> <label>Home</label>
        </Link>
        <h2>Practice Mode</h2>
      </div>

      <h3 className="round-result">{roundResult}</h3>
      <br />

      <div>
        <h3>Make your choice</h3>
        <div className="attack-selection">
          <img src="assets/rock-svgrepo-com.svg" onClick={() => onClickAttack(ATTACK_TYPES.ROCK)} alt="rock icon" />
          <img src="assets/paper-svgrepo-com.svg" onClick={() => onClickAttack(ATTACK_TYPES.PAPER)} alt="paper icon" />
          <img src="assets/scissors-9-svgrepo-com.svg" onClick={() => onClickAttack(ATTACK_TYPES.SCISSORS)} alt="scissors icon" />
        </div>
        <br />

        {!roundResult ? null :
          <div className="container-table">
            <div className="two-column-spacing">
              <h4>You:</h4>
              <h4><b>{userAttack}</b></h4>
            </div>

            <div className="two-column-spacing">
              <h4>Opponent:</h4>
              <h4><b>{opponentAttack}</b></h4>
            </div>
          </div>
        }

        <hr />
        <div id="practice-stats" className="container-table">
          <div className="two-column-spacing">
            <h4>Wins:</h4>
            <h4><b>{wins}</b></h4>
          </div>
          <div className="two-column-spacing">
            <h4>Losses:</h4>
            <h4><b>{losses}</b></h4>
          </div>
          <div className="two-column-spacing">
            <h4>Draws:</h4>
            <h4><b>{draws}</b></h4>
          </div>
          <div className="two-column-spacing">
            <h4>Win rate:</h4>
            <h4><b>{calcWinLossRatio()}%</b></h4>
          </div>
          <div className="two-column-spacing">
            <h4>Total rounds:</h4>
            <h4><b>{wins + losses + draws}</b></h4>
          </div>
        </div>
      </div>
    </section>
  )
}