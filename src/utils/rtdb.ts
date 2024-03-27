import { child, equalTo, get, limitToFirst, orderByChild, push, query, ref, remove, set, update } from "firebase/database"
import { db } from "../../firebase";
import { DB_DOC_KEYS, LOBBY_KEYS, STATS_KEYS, USERNAME_KEYS, USER_KEYS } from "./db-keys";
import { LOBBY_TYPES } from "./enums";
import calcRp from "./calc-rp";


/**
 * Adds the user to the "users" document with their email, username, and time registered.
 * After the user has been successfully added, the username is also added to the "usernames" document.
 * @param uid The Firebase id given to the user
 * @param email The email used to signed up with
 * @param username The user's username
 * @returns An object containing the user's email, username, and time registered
 */
export const dbAddUser = async (uid: string, email: string, username: string) => {
  try {
    const userRef = `${DB_DOC_KEYS.USERS}/${uid}`;
    const newUser = {
      [USER_KEYS.EMAIL]: email,
      [USER_KEYS.TIME_REGISTERED]: new Date().getTime(),
      [USER_KEYS.USERNAME]: username,
    }

    await update(ref(db, userRef), newUser);
    // console.log("added new user");

    const usernameRef = DB_DOC_KEYS.USERNAMES;
    const newName = {
      [username.toLowerCase()]: {
        [USERNAME_KEYS.ACTUAL]: username,
        [USERNAME_KEYS.USER]: uid,
      }
    }

    await update(ref(db, usernameRef), newName)
    // console.log("added new username");

    return newUser;

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log("couldn't add user");
    console.error(error);
  }
}


export const dbGetUser = async (uid: string): Promise<object> => {
  try {
    const userRef = `${DB_DOC_KEYS.USERS}/${uid}`;

    const snapshot = await get(child(ref(db), userRef));
    const value = snapshot.val();
    // console.log("value:", value);

    return value;

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log("couldn't add user");
    console.error(error);
    return {};
  }
}

export const dbGetUserFromUsername = async (username: string): Promise<ProfileInfo> => {
  try {
    const user: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    const usernameRef = `${DB_DOC_KEYS.USERNAMES}/${username}`;
    // console.log("usernameRef:", usernameRef);

    const snapshotUsername = await get(child(ref(db), usernameRef));
    const usernameValue = snapshotUsername.val();
    // console.log("usernameValue:", usernameValue);

    if (!usernameValue) return {};

    const actualUsername = usernameValue[USERNAME_KEYS.ACTUAL];
    user[USER_KEYS.USERNAME] = actualUsername;

    const uid = usernameValue[USERNAME_KEYS.USER];

    const statsRef = `${DB_DOC_KEYS.USERS}/${uid}/${USER_KEYS.STATS}`;
    const snapshotStats = await get(child(ref(db), statsRef));
    const statsValue = snapshotStats.val();
    // console.log("statsValue:", statsValue);
    user[USER_KEYS.STATS] = statsValue;

    const timeRegisteredRef = `${DB_DOC_KEYS.USERS}/${uid}/${USER_KEYS.TIME_REGISTERED}`;
    const snapshotTimeRegistered = await get(child(ref(db), timeRegisteredRef));
    const timeRegisteredValue = snapshotTimeRegistered.val();

    user[USER_KEYS.TIME_REGISTERED] = timeRegisteredValue;
    // console.log("user:", user);

    return user;
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log("couldn't get user from username");
    console.error(error);
    return {};
  }
}

export const dbGetUserStatsRanked = async (username: string): Promise<ProfileInfo> => {
  try {
    const user: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    const usernameRef = `${DB_DOC_KEYS.USERNAMES}/${username}`;
    // console.log("usernameRef:", usernameRef);

    const snapshotUsername = await get(child(ref(db), usernameRef));
    const usernameValue = snapshotUsername.val();
    // console.log("usernameValue:", usernameValue);

    if (!usernameValue) return {};

    const actualUsername = usernameValue[USERNAME_KEYS.ACTUAL];
    user[USER_KEYS.USERNAME] = actualUsername;

    const uid = usernameValue[USERNAME_KEYS.USER];

    const statsRef = `${DB_DOC_KEYS.USERS}/${uid}/${USER_KEYS.STATS}/${LOBBY_TYPES.RANKED}`;
    const snapshotStats = await get(child(ref(db), statsRef));
    const statsValue = snapshotStats.val() || {};
    // console.log("statsValue:", statsValue);
    user[USER_KEYS.STATS] = statsValue;

    // console.log("user:", user);

    return user;
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log("couldn't get user from username");
    console.error(error);
    return {};
  }
}

/**
 * Checks the database in the "usernames" document if the username already exists or not.
 * 
 * All usernames are stored as lowercase strings.
 * 
 * @param username The username to check
 * @returns True if the username already exists, false if not
 */
export const dbDoesUsernameExist = async (username: string): Promise<boolean> => {
  try {
    const dbRef = `${DB_DOC_KEYS.USERNAMES}/${username.trim().toLowerCase()}`;

    const snapshot = await get(child(ref(db), dbRef));
    const value = snapshot.val();
    // console.log("value:", value);
    return value ? true : false;

  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log("couldn't search for username");
    console.error(error);
    return false;
  }
}


// ************** LOBBY FUNCTIONS ************** \\


export const dbSearchLobbies = async (lobbyType: LOBBY_TYPES): Promise<object | null> => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}`;

    const snapshot = await get(query(ref(db, dbRef), orderByChild(LOBBY_KEYS.PLAYERS_NUM), equalTo(1), limitToFirst(1)));
    const value = snapshot.val();
    // console.log("value:", value);

    if (!value) return null;

    const id = Object.keys(value)[0];
    const lobby = Object.values<LobbyInfo>(value)[0];
    lobby[LOBBY_KEYS.ID] = id;
    // console.log("lobby:", lobby);

    return lobby
  } catch (error) {
    console.log("Couldn't search for casual lobbies");
    console.error(error);
    return null;
  }
}

/**
 * 
 * @param lobbyId Lobby id the user wants to use
 * @returns True if lobby does exist (user must make new code), False if lobby does not exist
 */
export const dbCheckPrivateLobby = async (lobbyId: string): Promise<boolean> => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${LOBBY_TYPES.PRIVATE}/${lobbyId}`;

    const snapshot = await get(ref(db, dbRef));
    return snapshot.exists();
  } catch (error) {
    console.log("couldn't check private lobbies");
    console.error(error);

    return true;
  }
}


export const dbCreateLobby = async (lobbyType: LOBBY_TYPES, user: object, lobbyId?: string): Promise<LobbyInfo | null> => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}`;
    const newLobbyId = lobbyId ? lobbyId : push(child(ref(db), dbRef)).key; // Create a new lobby id if one isn't provided 

    const lobbyRef = `${dbRef}/${newLobbyId}`;
    const host = Object.keys(user)[0];

    const newLobby = {
      [LOBBY_KEYS.HOST]: host,
      [LOBBY_KEYS.ID]: newLobbyId,
      [LOBBY_KEYS.PLAYERS]: user,
      [LOBBY_KEYS.PLAYERS_NUM]: 1, // The player creating this lobby
      [LOBBY_KEYS.TYPE]: lobbyType,
    };

    await set(ref(db, lobbyRef), newLobby);
    // console.log("successfully created a lobby!");

    return newLobby;
  } catch (error) {
    console.log("Couldn't create casual lobbies");
    console.error(error);
    return null;
  }
}

export const dbJoinLobby = async (lobbyType: LOBBY_TYPES, lobbyId: string, lobbyInfo: LobbyInfo): Promise<boolean> => {
  try {
    // console.log("@dbJoinLobby")
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}`;
    // console.log("lobbyId:", lobbyId);
    // console.log("dbRef:", dbRef);

    await update(ref(db, dbRef), lobbyInfo);

    return true;
  } catch (error) {
    console.log("Couldn't join casual lobby");
    console.error(error);
    return false;
  }
}

export const dbJoinPrivateLobby = async (lobbyId: string, user: object): Promise<object | null> => {
  try {
    // console.log("@dbJoinLobby")
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${LOBBY_TYPES.PRIVATE}/${lobbyId}`;
    // console.log("lobbyId:", lobbyId);
    // console.log("dbRef:", dbRef);

    const snapshot = await get(ref(db, dbRef));
    const lobbyInfo = snapshot.val();

    if (!lobbyInfo) return null; // Null check

    const { [LOBBY_KEYS.PLAYERS]: players, [LOBBY_KEYS.PLAYERS_NUM]: playerNum } = lobbyInfo;

    // Update players
    const updatedPlayers = { ...players, ...user };

    // Updated Lobby
    const updatedLobby: any = { [LOBBY_KEYS.PLAYERS]: updatedPlayers, [LOBBY_KEYS.PLAYERS_NUM]: playerNum + 1 }; // eslint-disable-line @typescript-eslint/no-explicit-any

    await update(ref(db, dbRef), updatedLobby);

    return updatedLobby;
  } catch (error) {
    console.log("Couldn't join private lobby");
    console.error(error);
    return null;
  }
}


export const dbLeaveLobby = async (lobbyType: LOBBY_TYPES, lobbyId: string, username: string): Promise<void> => {
  try {
    // console.log("@dbLeaveLobby");

    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.PLAYERS}/${username}`;
    // console.log("dbRef:", dbRef);

    await remove(ref(db, dbRef));

    // pull the current number and check if lobby should be closed or just subtract 1 "playerNum"
    const lobbyRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}`;
    const snapshot = await get(child(ref(db), lobbyRef));
    const numPlayers = snapshot.val()[LOBBY_KEYS.PLAYERS_NUM];

    if (numPlayers - 1 < 1) {
      // remove the whole lobby
      await remove(ref(db, lobbyRef));
    } else {
      // Update the number of players
      await update(ref(db, lobbyRef), { [LOBBY_KEYS.PLAYERS_NUM]: numPlayers - 1 });

      // Remove the match history
      const matchNumRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}`;
      await remove(ref(db, matchNumRef));
    }

  } catch (error) {
    console.log("Couldn't leave lobby");
    console.error(error);
  }
}

export const dbGetLobbyPlayers = async (lobbyType: LOBBY_TYPES, lobbyId: string): Promise<number> => {
  try {
    // console.log("@dbGetLobbyPlayers")

    // Update the playerNum everytime a player joins
    const playersRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.PLAYERS}`;
    const snapshot = await get(child(ref(db), playersRef));
    const players = snapshot.val();

    if (players) return Object.keys(players).length; // Return the current number of players
    else return 0; // If no players, then return 0
  } catch (error) {
    console.log("Couldn't get players in lobby");
    console.error(error);
    return 0;
  }
}


// ************** MATCH FUNCTIONS ************** \\


export const dbUpdateUserAttack = async (lobbyType: LOBBY_TYPES, lobbyId: string, matchCount: number, roundCount: number, userAttack: object): Promise<boolean> => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}`;
    // console.log("dbRef:", dbRef);

    await update(ref(db, dbRef), userAttack)

    const lastUpdate = {
      [LOBBY_KEYS.LAST_UPDATED]: new Date().getTime(), // Keep track of the last update for this lobby.
    }
    const lobbyRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}`;

    await update(ref(db, lobbyRef), lastUpdate)

    return true;
  } catch (error) {
    console.log("Couldn't update user attack");
    console.error(error);
    return false;
  }
}

/**
 * Removes the player's attacks from a match's round when a draw happens.
 * 
 * @param lobbyType Either "casual" or "ranked"
 * @param lobbyId ID of the lobby
 * @param matchCount Match count. E.g. "Match 1", "Match 2"
 * @param roundCount Round count. E.g. "Round 1", "Round 2"
 * @param opponent The opponents's attack. Prevents using past opponent's attack
 */
export const dbHandleRoundDraw = async (lobbyType: LOBBY_TYPES, lobbyId: string, matchCount: number, roundCount: number, username: string) => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}/${username}`;
    // console.log("dbRef:", dbRef);

    await remove(ref(db, dbRef));
  } catch (error) {
    console.log("Couldn't update user attack");
    console.error(error);
    throw error;
  }
}


export const dbUpdateMatch = async (lobbyType: LOBBY_TYPES, lobbyId: string, matchCount: number, roundCount: number, roundWinner: object) => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}`;
    // console.log("dbRef:", dbRef);

    await update(ref(db, dbRef), roundWinner);
  } catch (error) {
    console.log("Couldn't update user attack");
    console.error(error);
    throw error;
  }
}


export const dbUpdateRematch = async (lobbyType: LOBBY_TYPES, lobbyId: string, matchCount: number, username: string, doRematch: boolean) => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.REMATCH}`;
    // console.log("dbRef:", dbRef);
    const rematch = {
      [username]: doRematch,
    }

    await update(ref(db, dbRef), rematch);
  } catch (error) {
    console.log("Couldn't update round rematch");
    console.error(error);
    throw error;
  }
}


// ************** USER STAT UPDATES ************** \\

export const dbUpdateUserStats = async (lobbyType: LOBBY_TYPES, userId: string, rockCount: number, paperCount: number, scissorCount: number, didWin: boolean) => {
  try {
    const dbRef = `${DB_DOC_KEYS.USERS}/${userId}/${USER_KEYS.STATS}/${lobbyType}`;

    // Get the user's stats
    const snapshot = await get(child(ref(db), dbRef));
    const stats = snapshot.val() || {};

    // Update the stats with the new counts
    stats[STATS_KEYS.PAPER] = stats[STATS_KEYS.PAPER] ? (stats[STATS_KEYS.PAPER] + paperCount) : paperCount;
    stats[STATS_KEYS.ROCK] = stats[STATS_KEYS.ROCK] ? (stats[STATS_KEYS.ROCK] + rockCount) : rockCount;
    stats[STATS_KEYS.SCISSORS] = stats[STATS_KEYS.SCISSORS] ? (stats[STATS_KEYS.SCISSORS] + scissorCount) : scissorCount;

    // Update if user won or lost that match
    if (didWin) {
      stats[STATS_KEYS.WINS] = stats[STATS_KEYS.WINS] ? (stats[STATS_KEYS.WINS] + 1) : 1;
    } else {
      stats[STATS_KEYS.LOSSES] = stats[STATS_KEYS.LOSSES] ? (stats[STATS_KEYS.LOSSES] + 1) : 1;
    }

    await update(ref(db, dbRef), stats);


  } catch (error) {
    console.log("couldn't update user stats");
    console.error(error);
  }
}


export const dbUpdateUserRank = async (lobbyType: LOBBY_TYPES, userId: string, opponentRp: number, didWin: boolean) => {
  try {
    // Get the user's current RP rank
    const userRpRef = `${DB_DOC_KEYS.USERS}/${userId}/${USER_KEYS.STATS}/${lobbyType}/${STATS_KEYS.RP}`;
    const userRp = (await get(child(ref(db), userRpRef))).val() || 0;

    // Calculate points here
    const updatedRp = calcRp(userRp, opponentRp, didWin);
    const newRp = { [STATS_KEYS.RP]: updatedRp }

    const statsRef = `${DB_DOC_KEYS.USERS}/${userId}/${USER_KEYS.STATS}/${lobbyType}`;
    await update(ref(db, statsRef), newRp);

  } catch (error) {
    console.log("couldn't update ranked points");
    console.error(error);
  }
}