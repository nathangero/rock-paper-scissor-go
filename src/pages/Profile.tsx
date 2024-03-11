import { useParams } from "react-router-dom";
import { useAppSelector } from "../redux/hooks"
import { useEffect, useState } from "react";
import { dbGetUserFromUsername } from "../utils/rtdb";
import { USER_KEYS } from "../utils/db-keys";

export default function Profile() {

  const stateUser = useAppSelector(state => state.user);

  const { id: paramUser } = useParams();

  const [user, setUser] = useState<ProfileInfo | null>();

  useEffect(() => {
    const fetchUser = async () => {
      setUser(await getUserFromUsername());
    };
    fetchUser();
  }, []);


  const getUserFromUsername = async (): Promise<object | null> => {
    const adjustedName = (paramUser === "me") ? stateUser.username : paramUser?.replace(/%20/g, "").replace(/\s+/g, "");
    console.log("adjustedName:", adjustedName);

    if (adjustedName) return await dbGetUserFromUsername(adjustedName.toLowerCase());
    else return null;
  }

  return (
    <>
      {!user ?
        <h2>User doesn't exist</h2> :
        <h2>{user[USER_KEYS.USERNAME]}'s Profile</h2>
      }

    </>
  )
}