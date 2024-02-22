export enum ATTACK_TYPES {
  ROCK = "rock",
  PAPER = "paper",
  SCISSORS = "scissors",
  RANDOM = "random",
}

export enum LOBBY_TYPES {
  CASUAL = "casual",
  RANKED = "ranked",
}

export enum PLAYER_TYPES {
  USER,
  OPPONENT,
  OTHER
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
}