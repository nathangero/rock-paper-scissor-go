import { RANK_TIERS, RANK_TIER_PRIORITY, RANK_TIER_RANGE } from "./enums";

const ADD_POINTS = 10;
const SUB_POINTS = (ADD_POINTS / 2) + 1; // Lose more than half of earning points

/**
 * Calculates how a user's RP should change. Will either add or subtract the user's RP.
 * @param userRp The user's current RP value.
 * @param didWin Determines if the user should have RP subtracted/added.
 * @param opponentRank Opponent's rank. Factors into the calculation.
 */
const calcRp = (userRp: number, opponentRp: number, didWin: boolean): number => {
  // console.log("@calcRp")
  const userRank = getRank(userRp);
  const opponentRank = getRank(opponentRp);
  const rankDiff = RANK_TIER_PRIORITY[userRank] - RANK_TIER_PRIORITY[opponentRank];

  let pointsChange = 0;

  if (didWin) {
    pointsChange = ADD_POINTS;
    if (rankDiff < 0) {
      // If user's rank is less than opponent's, reward more points for beating a higher rank
      pointsChange += getBonus(-rankDiff);
    }
  } else {
    pointsChange = -SUB_POINTS;
    if (rankDiff > 0) {
      // If user's rank is greater than opponent's, subtract points + more if lost to lower rank
      pointsChange -= getBonus(rankDiff);
    }
  }

  const updatedPoints = userRp + pointsChange;

  // Don't let RP go below 0.
  return updatedPoints >= 0 ? updatedPoints : 0;
}


const getRank = (userRp: number): RANK_TIERS => {
  if (userRp <= RANK_TIER_RANGE.WOOD) {
    return RANK_TIERS.WOOD;
  } else if (userRp <= RANK_TIER_RANGE.STONE) {
    return RANK_TIERS.STONE;
  } else if (userRp <= RANK_TIER_RANGE.COPPER) {
    return RANK_TIERS.COPPER;
  } else if (userRp <= RANK_TIER_RANGE.SILVER) {
    return RANK_TIERS.SILVER;
  } else if (userRp <= RANK_TIER_RANGE.GOLD) {
    return RANK_TIERS.GOLD;
  } else if (userRp <= RANK_TIER_RANGE.PLATINUM) {
    return RANK_TIERS.PLATINUM;
  } else if (userRp <= RANK_TIER_RANGE.AMETHYST) {
    return RANK_TIERS.AMETHYST;
  } else if (userRp <= RANK_TIER_RANGE.RUBY) {
    return RANK_TIERS.RUBY;
  } else if (userRp <= RANK_TIER_RANGE.DIAMOND) {
    return RANK_TIERS.DIAMOND;
  } else if (userRp <= RANK_TIER_RANGE.IRIDIUM) {
    return RANK_TIERS.IRIDIUM;
  } else if (userRp > RANK_TIER_RANGE.IRIDIUM) {
    return RANK_TIERS.STAINLESS_STEEL;
  } else {
    return RANK_TIERS.WOOD;
  }
}

/**
 * Gives the user with a bonus depending how much higher their opponent's rank is than theirs.
 * 
 * This works for adding and subtracting points.
 * @param rankDiff The difference between the user and opponent's rank
 * @returns A bonus depending if the rank difference is big or not.
 */
const getBonus = (rankDiff: number): number => {
  let bonus = 0;

  if (rankDiff >= 1 && rankDiff <= 3) {
    bonus = 1; // Small bonus for close ranks
  } else if (rankDiff > 3 && rankDiff <= 6) {
    bonus = 2; // Medium bonus for moderate difference
  } else if (rankDiff > 6) {
    bonus = 3; // Larger bonus for significant difference
  }

  return bonus;
}


export { calcRp, getRank };