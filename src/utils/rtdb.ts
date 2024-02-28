import { child, equalTo, get, limitToFirst, orderByChild, push, query, ref, remove, set, update } from "firebase/database"
import { db } from "../../firebase";
import { DB_DOC_KEYS, LOBBY_KEYS, USERNAME_KEYS, USER_KEYS } from "./db-keys";
import { LOBBY_TYPES } from "./enums";


/**
 * Adds the user to the "users" document with their email, username, and time registered.
 * After the user has been successfully added, the username is also added to the "usernames" document.
 * @param uid The Firebase id given to the user
 * @param email The email used to signed up with
 * @param username The user's username
 * @returns An object containing the user's email, username, and time registered
 */
export const addUser = async (uid: string, email: string, username: string) => {
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


export const getUser = async (uid: string): Promise<object> => {
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

/**
 * Checks the database in the "usernames" document if the username already exists or not.
 * 
 * All usernames are stored as lowercase strings.
 * 
 * @param username The username to check
 * @returns True if the username already exists, false if not
 */
export const doesUsernameExist = async (username: string): Promise<boolean> => {
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


export const dbCreateLobby = async (lobbyType: LOBBY_TYPES, user: object): Promise<LobbyInfo | null> => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}`;
    const newLobbyId = push(child(ref(db), dbRef)).key; // Create a new lobby id

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


export const searchCasualLobbies = async (): Promise<object | null> => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${LOBBY_TYPES.CASUAL}`;

    const snapshot = await get(query(ref(db, dbRef), orderByChild(LOBBY_KEYS.PLAYERS_NUM), equalTo(1), limitToFirst(1)));
    const value = snapshot.val();
    // console.log("value:", value);

    if (!value) return null;

    const id = Object.keys(value)[0];
    const lobby = Object.values<LobbyInfo>(value)[0];
    lobby[LOBBY_KEYS.ID] = id;
    console.log("lobby:", lobby);

    return lobby
  } catch (error) {
    console.log("Couldn't search for casual lobbies");
    console.error(error);
    return null;
  }
}

export const joinCasualLobby = async (lobbyId: string, lobbyInfo: LobbyInfo): Promise<boolean> => {
  try {
    // console.log("@joinCasualLobby")
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${LOBBY_TYPES.CASUAL}/${lobbyId}`;
    // console.log("lobbyId:", lobbyId);
    // console.log("dbRef:", dbRef);
    // return true; // DEBUG
    await update(ref(db, dbRef), lobbyInfo);

    return true;
  } catch (error) {
    console.log("Couldn't join casual lobby");
    console.error(error);
    return false;
  }
}

export const dbLeaveLobby = async (lobbyType: LOBBY_TYPES.CASUAL, lobbyId: string, username: string): Promise<void> => {
  // TODO: Store the lobby id in the browser's local storage. so upon refresh, take the id and make the room disappear.
  try {
    console.log("@dbLeaveLobby");

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
    }

  } catch (error) {
    console.log("Couldn't update user attack");
    console.error(error);
  }
}

export const updateUserAttack = async (lobbyType: LOBBY_TYPES, lobbyId: string, matchCount: number, roundCount: number, userAttack: object): Promise<boolean> => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}`;
    // console.log("dbRef:", dbRef);

    await update(ref(db, dbRef), userAttack)

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
    console.log("dbRef:", dbRef);

    await remove(ref(db, dbRef));
  } catch (error) {
    console.log("Couldn't update user attack");
    console.error(error);
    throw error;
  }
}


export const updateMatchDb = async (lobbyType: LOBBY_TYPES, lobbyId: string, matchCount: number, roundCount: number, roundWinner: object) => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${lobbyType}/${lobbyId}/${LOBBY_KEYS.MATCH_NUM}/${matchCount}/${LOBBY_KEYS.ROUNDS}/${roundCount}`;
    console.log("dbRef:", dbRef);

    await update(ref(db, dbRef), roundWinner);
  } catch (error) {
    console.log("Couldn't update user attack");
    console.error(error);
    throw error;
  }
}