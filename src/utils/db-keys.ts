export enum DB_DOC_KEYS {
  LOBBIES = "lobbies",
  USERS = "users",
  USERNAMES = "usernames",
}

export enum LOBBY_KEYS {
  ID = "id",
  PLAYERS = "players",
  PLAYERS_NUM = "playersNum",
  ROUNDS = "rounds",
  WINNER = "winner",
  MATCH_NUM = "matchNum", // Keeps track of match count for rematches
}

export enum USERNAME_KEYS {
  ACTUAL = "actual", // username that has captialized letters
  USER = "user", // user Id
}

export enum USER_KEYS {
  EMAIL = "email",
  TIME_REGISTERED = "timeRegistered",
  USERNAME = "username",
}