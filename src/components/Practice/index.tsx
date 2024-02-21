import { Link } from "react-router-dom";
import "./style.css";
import { ATTACK_TYPES, ROUND_RESULT } from "../../utils/enums";
import { useEffect, useState } from "react";
import AttackSelection from "../AttackSelection";
import Round from "../Round";

export default function Practice() {

  const [userAttack, setUserAttack] = useState<ATTACK_TYPES>(ATTACK_TYPES.RANDOM);
  const [opponentAttack, setOpponentAttack] = useState<ATTACK_TYPES>(ATTACK_TYPES.RANDOM);
  const [roundResult, setRoundResult] = useState("Waiting...");
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);
  const [rockCount, setRockCount] = useState(0);
  const [paperCount, setPaperCount] = useState(0);
  const [scissorsCount, setScissorsCount] = useState(0);

  const [isPracticeRound, setIsPracticeRound] = useState(false);
  const [isPracticeRoundFinished, setIsPracticeRoundFinished] = useState(false);
  const [practiceRoundCount, setPracticeRoundCount] = useState(1);
  const [practiceRoundMax, setPracticeRoundMax] = useState(3);
  const [p1Wins, setP1Wins] = useState(0);
  const [p2Wins, setP2Wins] = useState(0);
  const [roundWinner, setRoundWinner] = useState("");


  useEffect(() => {
    if (!isPracticeRound) return;

    const roundMajority = Math.ceil(practiceRoundMax / 2);
    console.log("roundMajority:", roundMajority);
    
    if (p1Wins === roundMajority) {
      setRoundWinner("P1 Wins!");
      setIsPracticeRoundFinished(true);
    }

    if (p2Wins === roundMajority) {
      setRoundWinner("P2 Wins!");
      setIsPracticeRoundFinished(true);
    }

    console.log("roundWinner:", roundWinner);
  }, [p1Wins, p2Wins])

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

  const updateAttackCount = (userAttack: ATTACK_TYPES) => {
    switch (userAttack) {
      case ATTACK_TYPES.ROCK:
        setRockCount(rockCount + 1);
        break;
      case ATTACK_TYPES.PAPER:
        setPaperCount(paperCount + 1);
        break;
      case ATTACK_TYPES.SCISSORS:
        setScissorsCount(scissorsCount + 1);
        break;
    }
  }

  const updatePracticeRound = (result: ROUND_RESULT) => {
    console.log("@updatePracticeRound");
    console.log("result:", result)
    if (result === ROUND_RESULT.DRAW) {
      return;
    }

    if (practiceRoundCount + 1 <= practiceRoundMax) setPracticeRoundCount(practiceRoundCount + 1);
    if (result === ROUND_RESULT.WIN) {
      setP1Wins(p1Wins + 1);
    }
    else if (result === ROUND_RESULT.LOSE) {
      setP2Wins(p2Wins + 1);
    }
  }

  const onClickEmulateRound = (roundCount: number) => {
    console.log("starting best of", roundCount);
    setPracticeRoundMax(roundCount);
    setPracticeRoundCount(1);
    setRoundWinner("");
    setP1Wins(0);
    setP2Wins(0);
    setIsPracticeRoundFinished(false);
  }

  const onClickAttack = (userAttack: ATTACK_TYPES) => {
    if (isPracticeRound && isPracticeRoundFinished) return;

    updateAttackCount(userAttack);
    setUserAttack(userAttack);
    const opponentAttack = randomAttack();
    setOpponentAttack(opponentAttack);
    const result = decideWinner(userAttack, opponentAttack);

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

    if (isPracticeRound) updatePracticeRound(result);
  }

  const onClickResetStats = () => {
    setRoundResult("Waiting...");
    setWins(0);
    setLosses(0);
    setDraws(0);
    setRockCount(0);
    setPaperCount(0);
    setScissorsCount(0);
    setP1Wins(0);
    setP2Wins(0);
  }

  const renderAttack = () => {
    return (
      <>
        {isPracticeRound ?
          <Round roundCount={practiceRoundCount} roundMax={practiceRoundMax} isFinished={isPracticeRoundFinished} onClickAttack={onClickAttack} /> :
          <AttackSelection onClickAttack={onClickAttack} />
        }

        <br />

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
      </>
    )
  }


  const renderStats = () => {
    return (
      <>
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

          <hr />
          <div className="two-column-spacing">
            <h4>Rocks:</h4>
            <h4><b>{rockCount}</b></h4>
          </div>
          <div className="two-column-spacing">
            <h4>Papers:</h4>
            <h4><b>{paperCount}</b></h4>
          </div>
          <div className="two-column-spacing">
            <h4>Scissors:</h4>
            <h4><b>{scissorsCount}</b></h4>
          </div>
        </div>
      </>
    )
  }

  return (
    <section id="mode-practice">
      <div className="">
        <h2>Practice Mode</h2>

        <div>
          <Link
            to={"/"}
            className="btn button-positive mx-2"
          >
            <i className="bi bi-arrow-left"></i> <label>Home</label>
          </Link>

          <button className="btn button-positive mx-2" onClick={() => setIsPracticeRound(!isPracticeRound)}>{isPracticeRound ? "Stop Emulation" : "Emulate Round"}</button>
          <button className="btn button-negative mx-2" onClick={() => onClickResetStats()}>Reset Stats</button>
        </div>
        <br />
        {!isPracticeRound ? null :
          <div>
            <button className="btn button-positive mx-2" onClick={() => onClickEmulateRound(3)}>Best of 3</button>
            <button className="btn button-positive mx-2" onClick={() => onClickEmulateRound(5)}>Best of 5</button>
            <button className="btn button-positive mx-2" onClick={() => onClickEmulateRound(7)}>Best of 7</button>
          </div>
        }
      </div>
      <hr />

      {isPracticeRound ?
        <h3 className="round-result">{roundWinner}</h3> :
        <h3 className="round-result">{roundResult}</h3>
      }

      <div>
        {renderAttack()}

        <hr />

        {renderStats()}
      </div>
    </section>
  )
}