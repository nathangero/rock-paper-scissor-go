// import { ref, set, get, child, push, remove, update, limitToLast, query } from "firebase/database"
import { child, equalTo, get, orderByKey, query, ref, set } from "firebase/database"
import { db } from "../../firebase";
import { DB_DOC_KEYS } from "./db-keys";

export const addUser = async (uid: string, email: string, username: string) => {
  try {
    const userRef = `${DB_DOC_KEYS.USERS}/${uid}`;
    const newUser = {
      email: email,
      username: username,
      timeRegistered: new Date().getTime(),
    }

    const resultUser = await set(ref(db, userRef), newUser)
    console.log("resultUser:", resultUser);

    const usernameRef = DB_DOC_KEYS.USERNAMES;
    const newName = {
      [username.toLowerCase()]: {

      }
    }

    const resultUsername = await set(ref(db, usernameRef), newName)
    console.log("resultUsername:", resultUsername);
    
  } catch (error: any) {
    console.log("couldn't add user");
    console.error(error);
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