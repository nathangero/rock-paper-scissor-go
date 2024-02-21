import { ATTACK_TYPES } from "../../utils/enums";
import AttackSelection from "../AttackSelection";

export default function Round({ roundCount, roundMax, isFinished, onClickAttack }: Round) {

  return (
    <>
      <h2>Round {roundCount} / {roundMax}</h2>
      <AttackSelection isFinished={isFinished} onClickAttack={onClickAttack} />
    </>
  )
}

interface Round {
  roundCount: number;
  roundMax: number;
  isFinished: boolean;
  onClickAttack: (attackType: ATTACK_TYPES) => void;
}