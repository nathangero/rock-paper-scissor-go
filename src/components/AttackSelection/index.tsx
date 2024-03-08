import { ATTACK_TYPES } from "../../utils/enums"

export default function AttackSelection({ onClickAttack }: AttackSelection) {

  return (
    <>
      <h3>Make your choice</h3>
      <div className="attack-selection">
        <img src="/assets/rock-svgrepo-com.svg" onClick={() => onClickAttack(ATTACK_TYPES.ROCK)} alt="rock icon" />
        <img src="/assets/paper-svgrepo-com.svg" onClick={() => onClickAttack(ATTACK_TYPES.PAPER)} alt="paper icon" />
        <img src="/assets/scissors-9-svgrepo-com.svg" onClick={() => onClickAttack(ATTACK_TYPES.SCISSORS)} alt="scissors icon" />
      </div>
    </>
  )
}

interface AttackSelection {
  onClickAttack: (attackType: ATTACK_TYPES) => void;
}