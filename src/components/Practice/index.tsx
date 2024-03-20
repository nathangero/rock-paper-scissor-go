import "./style.css";
import "../../animations/swing-animation.css";
import { Link } from "react-router-dom";
import { ATTACK_TYPES, PLAYER_TYPES, ROUND_RESULT } from "../../utils/enums";
import { useEffect, useState } from "react";
import AttackSelection from "../AttackSelection";
import Round from "../Round";

export default function Practice() {

  const [userAttack, setUserAttack] = useState<ATTACK_TYPES>(ATTACK_TYPES.RANDOM);
  const [opponentAttack, setOpponentAttack] = useState<ATTACK_TYPES>(ATTACK_TYPES.RANDOM);
  const [roundResult, setRoundResult] = useState<string>("Waiting...");
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);
  const [draws, setDraws] = useState<number>(0);
  const [rockCount, setRockCount] = useState<number>(0);
  const [paperCount, setPaperCount] = useState<number>(0);
  const [scissorsCount, setScissorsCount] = useState<number>(0);

  const [isPracticeRound, setIsPracticeMatch] = useState<boolean>(false);
  const [isPracticeRoundFinished, setIsPracticeRoundFinished] = useState<boolean>(false);
  const [practiceRoundCount, setPracticeRoundCount] = useState<number>(1);
  const [practiceRoundMax, setPracticeRoundMax] = useState<number>(3);
  const [roundMajority, setRoundMajority] = useState<number>(0); // Amount of rounds needed to win
  const [p1Wins, setP1Wins] = useState<number>(0);
  const [p2Wins, setP2Wins] = useState<number>(0);
  const [practiceRoundDraw, setPracticeRoundDraw] = useState<number>(0);
  const [roundWinner, setRoundWinner] = useState<string>("");
  const [roundProgress, setRoundProgress] = useState<any>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [isShowingEpicCountdown, setIsShowingEpicCountdown] = useState<boolean>(false);
  const [epicCoundownText, setEpicCountdownText] = useState<string>("");


  useEffect(() => {
    if (isPracticeRound) {
      onClickEmulateRound(practiceRoundMax);
    }
  }, [isPracticeRound]);

  useEffect(() => {
    if (!isShowingEpicCountdown || !isPracticeRoundFinished || isPracticeRound) {
      // When the countdown is over, scroll to the bottom of the page to show the match stats
      document.getElementById("practice-round-stats")?.scrollIntoView({ behavior: "instant" });
    }
  }, [isShowingEpicCountdown, isPracticeRoundFinished, isPracticeRound])

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

  /**
   * 
   * @param winnerText What will be displayed to the user when the match ends
   */
  const doEpicCountdown = (winnerText: string) => {
    // console.log("@doEpicCountdown");
    const countdownInterval = 400;
    const text = ["SCISSORS", "PAPER", "ROCK"];
    let countdown = text.length;

    setIsShowingEpicCountdown(true);
    const timer = setInterval(() => {
      setEpicCountdownText(text[--countdown]);
      setIsPracticeRoundFinished(true);
      if (countdown < 0) {
        clearInterval(timer);
        setIsShowingEpicCountdown(false);
        setRoundWinner(winnerText);
      }
    }, countdownInterval);
  }

  /**
   * Randomly picks an attack from the `ATTACK_TYPES` enum.
   * @returns `ATTACK_TYPES` enum
   */
  const randomAttack = () => {
    const selection = Math.round(Math.random() * 2);
    // console.log("selection:", selection);
    if (selection === 0) return ATTACK_TYPES.ROCK;
    else if (selection === 1) return ATTACK_TYPES.PAPER;
    else if (selection === 2) return ATTACK_TYPES.SCISSORS;
    else return ATTACK_TYPES.ROCK; // Just in case
  }


  /**
   * Calculates the win/loss ratio of the player.
   * @returns A float with 2 decimal places
   */
  const calcWinLossRatio = (): string | number => {
    if (wins === 0) return 0;
    else if (wins > 0 && losses === 0) return 100;
    return (wins / losses).toFixed(2);
  }

  // ************** UPDATE ************** \\

  /**
   * Updates the state variable that's related to the attack chosen.
   * @param userAttack The attack the player picked
   */
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
    // console.log("@updatePracticeRound");
    // console.log("result:", result)
    if (result === ROUND_RESULT.DRAW) {
      setPracticeRoundDraw(practiceRoundDraw + 1);
      return;
    }

    // Use temp variables to see if there'll be a winner
    let updatedP1Wins = p1Wins;
    let updatedP2Wins = p2Wins;
    const updatedRoundProgress = [...roundProgress];

    // Update the player's win count and update the round progress element
    if (result === ROUND_RESULT.WIN) {
      updatedP1Wins++;
      updatedRoundProgress[practiceRoundCount - 1] = PLAYER_TYPES.USER;
      setRoundProgress(updatedRoundProgress);
    }
    else if (result === ROUND_RESULT.LOSE) {
      updatedP2Wins++;
      updatedRoundProgress[practiceRoundCount - 1] = PLAYER_TYPES.OPPONENT;
      setRoundProgress(updatedRoundProgress);
    }


    if (updatedP1Wins === roundMajority) {
      doEpicCountdown("You win!");

    } else if (updatedP2Wins === roundMajority) {
      doEpicCountdown("You lost");

    } else if (practiceRoundCount + 1 <= practiceRoundMax) {
      // Only increment round count if there is NO winner
      setPracticeRoundCount(practiceRoundCount + 1);
    }

    setP1Wins(updatedP1Wins);
    setP2Wins(updatedP2Wins);
  }


  // ************** ON CLICK ************** \\

  const onClickEmulateRound = (roundCount: number) => {
    // console.log("starting best of", roundCount);
    setPracticeRoundMax(roundCount);
    setPracticeRoundCount(1);
    setRoundMajority(Math.ceil(roundCount / 2));
    setRoundWinner("");
    setP1Wins(0);
    setP2Wins(0);
    setPracticeRoundDraw(0);
    setIsPracticeRoundFinished(false);
    setRoundProgress([]);
    // Create the round progress array with the appropriate amount of elements
    setRoundProgress(Array.from({ length: roundCount }, () => PLAYER_TYPES.OTHER));
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
    setPracticeRoundDraw(0);
  }

  const renderAttack = () => {
    return (
      <>
        {isPracticeRound ?
          <>
            {isShowingEpicCountdown ?
              <>
                <h3 className="countdown-text">{epicCoundownText}</h3>
                <img src="assets/fist-cross-dictator-bang-svgrepo-com.svg" width={100} className="fist" alt="rock icon" />
              </> :
              <Round roundCount={practiceRoundCount} roundMax={practiceRoundMax} roundProgress={roundProgress} onClickAttack={onClickAttack} />
            }
          </> :
          <AttackSelection onClickAttack={onClickAttack} />
        }

        <br />

        {isShowingEpicCountdown ? null :
          <>
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

            {isPracticeRoundFinished ? <button className="btn button-positive fs-5" onClick={() => onClickEmulateRound(practiceRoundMax)}>REMATCH</button> : null}
          </>
        }
      </>
    )
  }


  const renderStats = () => {
    return (
      <>
        {isPracticeRound ?
          <>
            {isShowingEpicCountdown ? null :
              <div id="practice-round-stats" className="container-table">
                <div className="two-column-spacing">
                  <h4>Wins:</h4>
                  <h4><b>{p1Wins}</b></h4>
                </div>
                <div className="two-column-spacing">
                  <h4>Losses:</h4>
                  <h4><b>{p2Wins}</b></h4>
                </div>
                <div className="two-column-spacing">
                  <h4>Draws:</h4>
                  <h4><b>{practiceRoundDraw}</b></h4>
                </div>
                <div className="two-column-spacing">
                  <h4>Total rounds:</h4>
                  <h4><b>{p1Wins + p2Wins + practiceRoundDraw}</b></h4>
                </div>
              </div>
            }
          </> :
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
              <h4>Win ratio:</h4>
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
        }

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
            className="btn button-positive m2"
          >
            <i className="bi bi-arrow-left"></i> Home
          </Link>

          <button className="btn button-positive m-2" onClick={() => setIsPracticeMatch(!isPracticeRound)}>{isPracticeRound ? "Stop Match" : "Practice Match"}</button>
          <button className="btn button-negative " onClick={() => onClickResetStats()}>Reset Stats</button>
        </div>
        <br />
        {!isPracticeRound ? null :
          <div>
            <button className="btn button-positive m-2" onClick={() => onClickEmulateRound(3)}>Best of 3</button>
            <button className="btn button-positive m-2" onClick={() => onClickEmulateRound(5)}>Best of 5</button>
            <button className="btn button-positive m-2" onClick={() => onClickEmulateRound(7)}>Best of 7</button>
          </div>
        }
      </div>
      <hr className="p-0 m-0" />

      {isPracticeRound ?
        <h3 className="round-result">{roundWinner}</h3> :
        <h3 className="round-result">{roundResult}</h3>
      }

      <div>
        {renderAttack()}


        {isShowingEpicCountdown ? null : <hr />}

        {renderStats()}
      </div>


    </section>
  )
}