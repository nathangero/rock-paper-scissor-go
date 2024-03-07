export enum DB_DOC_KEYS {
  LOBBIES = "lobbies",
  USERS = "users",
  USERNAMES = "usernames",
}

export enum LOBBY_KEYS {
  HOST = "host",
  ID = "id",
  PLAYERS = "players",
  PLAYERS_NUM = "playersNum",
  ROUNDS = "rounds",
  WINNER = "winner",
  MATCH_NUM = "matchNum", // Keeps track of match count for rematches
  REMATCH = "rematch",
  TYPE = "lobbyType",
}

export enum STATS_KEYS {
  PAPER = "paper",
  ROCK = "rock",
  SCISSORS = "scissors",
}

export enum USERNAME_KEYS {
  ACTUAL = "actual", // username that has captialized letters
  USER = "user", // user Id
}

export enum USER_KEYS {
  EMAIL = "email",
  STATS = "stats",
  TIME_REGISTERED = "timeRegistered",
  USERNAME = "username",
}