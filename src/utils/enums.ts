export enum ATTACK_TYPES {
  ROCK = "rock",
  PAPER = "paper",
  SCISSORS = "scissors",
  RANDOM = "random",
}

export enum LOBBY_TYPES {
  CASUAL = "casual",
  PRIVATE = "private",
  RANKED = "ranked",
}

export enum LOCAL_STORAGE_KEYS {
  LOBBY = "rpsgo-lobby",
}

export enum PLAYER_TYPES {
  USER,
  OPPONENT,
  OTHER
}

export enum RANK_TIERS {
  WOOD = "wood",
  STONE = "stone",
  COPPER = "copper",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum",
  AMETHYST = "amethyst",
  RUBY = "ruby",
  DIAMOND = "diamond",
  IRIDIUM = "iridium",
  STAINLESS_STEEL = "stainless steel",
}

export enum RANK_TIER_RANGE {
  WOOD = 100,
  STONE = 250,
  COPPER = 500,
  SILVER = 750,
  GOLD = 1000,
  PLATINUM = 1500,
  AMETHYST = 2000,
  RUBY = 3000,
  DIAMOND = 5000,
  IRIDIUM = 7500,
}

export const RANK_TIER_PRIORITY = {
  [RANK_TIERS.WOOD]: 1,
  [RANK_TIERS.STONE]: 2,
  [RANK_TIERS.COPPER]: 3,
  [RANK_TIERS.SILVER]: 4,
  [RANK_TIERS.GOLD]: 5,
  [RANK_TIERS.PLATINUM]: 6,
  [RANK_TIERS.AMETHYST]: 7,
  [RANK_TIERS.RUBY]: 8,
  [RANK_TIERS.DIAMOND]: 9,
  [RANK_TIERS.IRIDIUM]: 10,
  [RANK_TIERS.STAINLESS_STEEL]: 11,
}


export enum ROUND_RESULT {
  WIN = "win",
  LOSE = "lose",
  DRAW = "draw",
}

export enum ROUTER_LINKS {
  HOME = "/",
  LOBBY = "/lobby",
  LOGIN = "/login",
  PRACTICE = "/practice",
  PROFILE = "/profile",
  FINISHED = "/finished",
}

export const VERSION_NUM = "1.01";
