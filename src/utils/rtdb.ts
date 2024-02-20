import { child, get, ref, update } from "firebase/database"
import { db } from "../../firebase";
import { DB_DOC_KEYS, USERNAME_KEYS, USER_KEYS } from "./db-keys";


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

  } catch (error: any) {
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

  } catch (error: any) {
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

  } catch (error: any) {
    console.log("couldn't search for username");
    console.error(error);
    return false;
  }
}