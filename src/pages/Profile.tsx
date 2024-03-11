import React from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../redux/hooks"
import { useEffect, useState } from "react";
import { dbGetUserFromUsername } from "../utils/rtdb";
import { USER_KEYS } from "../utils/db-keys";
import { ATTACK_TYPES } from "../utils/enums";

export default function Profile() {

  const stateUser = useAppSelector(state => state.user);

  const { id: paramUser } = useParams();

  const [user, setUser] = useState<ProfileInfo | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = await getUserFromUsername();

      if (fetchedUser) setUser(fetchedUser);
      setIsLoadingUser(false);
    };
    fetchUser();
  }, []);


  const getUserFromUsername = async (): Promise<object | null> => {
    const adjustedName = (paramUser === "me") ? stateUser.username : paramUser?.replace(/%20/g, "");
    // console.log("adjustedName:", adjustedName);

    if (adjustedName) return await dbGetUserFromUsername(adjustedName.toLowerCase());
    else return null;
  }


  const getDateRegistered = (): string => {
    if (!user) return "";

    const date = new Date(user[USER_KEYS.TIME_REGISTERED]);
    const month = date.getMonth();
    const year = date.getFullYear();

    return `Joined: ${month}/${year}`;
  }

  return (
    <>
      {isLoadingUser ?
        <h2>Loading user profile...</h2> :
        <>
          {!user ?
            <h2>User doesn't exist</h2> :
            <>
              <h2>{user[USER_KEYS.USERNAME]}'s Profile</h2>
              <p className="fs-5">{getDateRegistered()}</p>
              <br />
              <>
                <h3>Player Match Statistics</h3>
                {!user[USER_KEYS.STATS] ? <h4>No games played yet</h4> :
                  <>
                    {Object.keys(user[USER_KEYS.STATS]).map((key, index) => (
                      <React.Fragment key={index}>
                        <h3><u>{key.charAt(0).toUpperCase() + key.slice(1)}</u></h3>
                        <div className="container-table">
                          <div className="d-flex justify-content-between">
                            <h4>Rocks:</h4>
                            <h4>{user[USER_KEYS.STATS][key][ATTACK_TYPES.ROCK]}</h4>
                          </div>
                          <div className="d-flex justify-content-between">
                            <h4>Paper:</h4>
                            <h4>{user[USER_KEYS.STATS][key][ATTACK_TYPES.PAPER]}</h4>
                          </div>
                          <div className="d-flex justify-content-between">
                            <h4>Scissors:</h4>
                            <h4>{user[USER_KEYS.STATS][key][ATTACK_TYPES.SCISSORS]}</h4>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </>
                }

              </>
            </>
          }
        </>
      }
    </>
  )
}