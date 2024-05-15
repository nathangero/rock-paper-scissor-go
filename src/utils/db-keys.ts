export enum DB_DOC_KEYS {
  LOBBIES = "lobbies",
  USERS = "users",
  USERNAMES = "usernames",
}

export enum LOBBY_KEYS {
  HOST = "host",
  ID = "id",
  LAST_UPDATED = "lastUpdated",
  MATCH_NUM = "matchNum", // Keeps track of match count for rematches
  PLAYERS = "players",
  PLAYERS_NUM = "playersNum",
  ROUNDS = "rounds",
  REMATCH = "rematch",
  TYPE = "lobbyType",
  WINNER = "winner",
}

export enum STATS_KEYS {
  MATCH_START_NUM = "matchStartNum", // Count how many matches the user has been in
  MATCH_END_NUM = "matchEndNum", // Count how many matches the user has completed
  LOSSES = "losses",
  PAPER = "paper",
  ROCK = "rock",
  RP = "rp", // Ranked Points
  SCISSORS = "scissors",
  WINS = "wins",
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