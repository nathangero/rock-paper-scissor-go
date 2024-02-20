// import { ref, set, get, child, push, remove, update, limitToLast, query } from "firebase/database"
import { child, equalTo, get, orderByKey, query, ref, set } from "firebase/database"
import { db } from "../../firebase";
import { DB_KEYS } from "./db-keys";

export const addUser = async (uid: string, email: string, username: string) => {
  try {
    const userRef = `${DB_KEYS.USERS}/${uid}`;
    const newUser = {
      email: email,
      username: username,
      timeRegistered: new Date().getTime(),
    }

    const resultUser = await set(ref(db, userRef), newUser)
    console.log("resultUser:", resultUser);

    const usernameRef = DB_KEYS.USERNAMES;
    const newName = {
      [username]: uid
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
 * @param username The username to check
 * @returns True if the username already exists, false if not
 */
export const getUsername = async (username: string): Promise<boolean> => {
  try {
    const dbRef = DB_KEYS.USERNAMES;

    const results = (await get(child(ref(db), dbRef))).hasChild(username);
    console.log("results:", results);
    return results;

  } catch (error: any) {
    console.log("couldn't search for username");
    console.error(error);
    return false;
  }
}