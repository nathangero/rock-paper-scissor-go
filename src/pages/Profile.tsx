import React from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../redux/hooks"
import { useEffect, useState } from "react";
import { dbGetUserFromUsername } from "../utils/rtdb";
import { STATS_KEYS, USER_KEYS } from "../utils/db-keys";

export default function Profile() {

  const stateUser = useAppSelector(state => state.user);

  const { id: paramUser } = useParams();

  const [user, setUser] = useState<ProfileInfo>({});
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

  const calcWinLossRatio = (wins: number, losses: number): string | number => {
    if (!wins || !losses) return 0; // If one isn't defined, just show 0
    else if (wins === 0) return 0;
    else if (wins > 0 && losses === 0) return 100;
    return (wins / losses).toFixed(2);
  }

  // *************** RENDER FUNCTIONS *************** \\

  const renderStatsAttack = () => {
    return (
      <>
        {!user[USER_KEYS.STATS] ? <h4>No games played yet</h4> :
          <>
            {Object.keys(user[USER_KEYS.STATS]).map((lobbyType, index) => (
              <React.Fragment key={index}>
                <h3><u>{lobbyType.charAt(0).toUpperCase() + lobbyType.slice(1)}</u></h3>
                <div className="container-table">
                  <div className="d-flex justify-content-between">
                    <h4>Rocks:</h4>
                    <h4>{user[USER_KEYS.STATS][lobbyType][STATS_KEYS.ROCK]}</h4>
                  </div>
                  <div className="d-flex justify-content-between">
                    <h4>Paper:</h4>
                    <h4>{user[USER_KEYS.STATS][lobbyType][STATS_KEYS.PAPER]}</h4>
                  </div>
                  <div className="d-flex justify-content-between">
                    <h4>Scissors:</h4>
                    <h4>{user[USER_KEYS.STATS][lobbyType][STATS_KEYS.SCISSORS]}</h4>
                  </div>
                  {renderStatsWinLoss(lobbyType)}
                </div>
              </React.Fragment>
            ))}
          </>
        }
      </>
    )
  }


  const renderStatsWinLoss = (lobbyType: string) => {
    const wins = user[USER_KEYS.STATS][lobbyType][STATS_KEYS.WINS];
    const losses = user[USER_KEYS.STATS][lobbyType][STATS_KEYS.LOSSES];

    return (
      <>
        <hr />
        <div className="d-flex justify-content-between">
          <h4>Wins:</h4>
          <h4>{wins ? wins : 0}</h4>
        </div>
        <div className="d-flex justify-content-between">
          <h4>Losses:</h4>
          <h4>{losses ? losses : 0}</h4>
        </div>
        <div className="d-flex justify-content-between">
          <h4>Win/Loss Ratio:</h4>
          <h4>{calcWinLossRatio(wins, losses)}%</h4>
        </div>
      </>
    )

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
                {renderStatsAttack()}
              </>
            </>
          }
        </>
      }
    </>
  )
}