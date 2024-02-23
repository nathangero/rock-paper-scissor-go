import { child, equalTo, get, limitToFirst, orderByChild, query, ref, update } from "firebase/database"
import { db } from "../../firebase";
import { DB_DOC_KEYS, LOBBY_KEYS, USERNAME_KEYS, USER_KEYS } from "./db-keys";


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


export const searchCasualLobbies = async (): Promise<object> => {
  try {
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${DB_DOC_KEYS.CASUAL}`;

    const snapshot = await get(query(ref(db, dbRef), orderByChild(LOBBY_KEYS.PLAYERS_NUM), equalTo(1), limitToFirst(1)));
    const value = snapshot.val();
    // console.log("value:", value);

    if (!value) return {};

    const id = Object.keys(value)[0];
    const lobby = Object.values<LobbyInfo>(value)[0];
    lobby[LOBBY_KEYS.ID] = id;
    console.log("lobby:", lobby);

    return lobby
  } catch (error) {
    console.log("Couldn't search for casual lobbies");
    console.error(error);
    return {};
  }
}

export const joinCasualLobby = async (lobbyInfo: LobbyInfo): Promise<boolean> => {
  try {
    console.log("@joinCasualLobby")
    const id = lobbyInfo[LOBBY_KEYS.ID];
    const dbRef = `${DB_DOC_KEYS.LOBBIES}/${DB_DOC_KEYS.CASUAL}/${id}`;
    console.log("id:", id);
    console.log("dbRef:", dbRef);
    
    await update(ref(db, dbRef), lobbyInfo);

    return true;
  } catch (error) {
    console.log("Couldn't join casual lobby");
    console.error(error);
    return false;
  }
}