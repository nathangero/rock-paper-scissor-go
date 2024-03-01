import { Link, useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { useAppDispatch, useAppSelector } from "../redux/hooks"
import { LOBBY_TYPES, LOCAL_STORAGE_KEYS, ROUTER_LINKS } from "../utils/enums";
import { dbCreateLobby, dbJoinLobby, dbSearchLobbies } from "../utils/rtdb";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect, useState } from "react";
import { LOBBY_KEYS } from "../utils/db-keys";
import { auth } from "../../firebase";
import { USER_ACTIONS } from "../redux/reducer";

export default function Home() {

  const user = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [loadingSpinner, setLoadingSpinner] = useState<Modal | null>(null);
  const [loadingText, setLoadingText] = useState<string>("Finding Lobby...")

  useEffect(() => {
    // Initialize bootstrap modals 
    const loadingSpinner = document.querySelector<HTMLDivElement>(".loading-spinner")?.querySelector<HTMLDivElement>("#modal-loading-spinner");
    if (loadingSpinner) setLoadingSpinner(new Modal(loadingSpinner));
  }, []);


  const joinLobby = async (lobbyType: LOBBY_TYPES, lobbyInfo: LobbyInfo) => {
    if (!lobbyInfo || Object.keys(lobbyInfo).length === 0) return;

    // Deconstruct variables
    const { [LOBBY_KEYS.PLAYERS]: players, [LOBBY_KEYS.PLAYERS_NUM]: playersNum } = lobbyInfo;

    // Update players
    const updatedPlayers = { ...players, [user.username]: auth.currentUser?.uid };

    // Updated Lobby
    const updatedLobby: any = { [LOBBY_KEYS.PLAYERS]: updatedPlayers, [LOBBY_KEYS.PLAYERS_NUM]: playersNum + 1 }; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get lobbyId
    const lobbyId = lobbyInfo[LOBBY_KEYS.ID];

    // console.log("updatedLobby:", updatedLobby);

    let didJoin = false;
    switch (lobbyType) {
      case LOBBY_TYPES.CASUAL:
        didJoin = await dbJoinLobby(LOBBY_TYPES.CASUAL, lobbyId, updatedLobby)
        break;

      case LOBBY_TYPES.RANKED:
        console.log("search for ranked")
        break;
    }

    if (didJoin) {
      // console.log("MOVE USER TO LOBBY PAGE AND START THE MATCH");
      setLoadingText("Joining lobby!");
      setTimeout(() => {
        loadingSpinner?.hide();
        updatedLobby[LOBBY_KEYS.ID] = lobbyId; // Add the lobby id before adding it to the store
        updatedLobby[LOBBY_KEYS.TYPE] = lobbyType;
        dispatch({
          type: USER_ACTIONS.JOIN_LOBBY,
          lobby: updatedLobby,
        });

        const lobbyStorage = {
          [LOBBY_KEYS.ID]: lobbyId,
          [LOBBY_KEYS.TYPE]: lobbyType,
        }

        localStorage.setItem(LOCAL_STORAGE_KEYS.LOBBY, JSON.stringify(lobbyStorage));
        navigate(`${ROUTER_LINKS.LOBBY}/${lobbyType}`);
      }, 1000);

    } else {
      console.log("Couldn't join the lobby. Could be full.");
      loadingSpinner?.hide();
    }
  }

  const createLobby = async (lobbyType: LOBBY_TYPES) => {
    try {
      setLoadingText("Creating a lobby...");
      const userObj = { [user.username]: auth.currentUser?.uid };
      const newLobby = await dbCreateLobby(lobbyType, userObj);
      console.log("new lobby:", newLobby);
      if (newLobby) {
        setTimeout(() => {
          loadingSpinner?.hide();
          dispatch({
            type: USER_ACTIONS.JOIN_LOBBY,
            lobby: newLobby,
          })

          const lobbyStorage = {
            [LOBBY_KEYS.ID]: newLobby[LOBBY_KEYS.ID],
            [LOBBY_KEYS.TYPE]: lobbyType,
          }

          localStorage.setItem(LOCAL_STORAGE_KEYS.LOBBY, JSON.stringify(lobbyStorage));
          navigate(`${ROUTER_LINKS.LOBBY}/${lobbyType}`);
        }, 1000);
      }
    } catch (error) {
      console.log("Couldn't create lobby");
      console.error(error);
      loadingSpinner?.hide();
    }
  }

  // ************** ON CLICK ************** \\

  const onClickFindLobby = async (lobbyType: LOBBY_TYPES) => {
    try {
      loadingSpinner?.show();
      const lobby = await dbSearchLobbies(lobbyType);

      if (lobby) {
        switch (lobbyType) {
          case LOBBY_TYPES.CASUAL:
            joinLobby(lobbyType, lobby);
            break;

          case LOBBY_TYPES.RANKED:
            console.log("search for ranked")
            break;
        }
      } else {
        await createLobby(lobbyType);
        // console.log("created lobby");
      }

    } catch (error) {
      console.log("Home.tsx couldn't search for casual lobbies");
      console.error(error);
      loadingSpinner?.hide();
    }
  }

  return (
    <>
      <h1>Rock Paper Scissor, Go!</h1>

      {user ?
        <h4>Welcome back, {user?.username}!</h4> :
        <h4>Play against others in Rock, Paper, Scissors and move up in rank!</h4>
      }

      <div>
        <div className="mb-2">
          {/* <Link to={`${ROUTER_LINKS.LOBBY}/${LOBBY_TYPES.CASUAL}`} className="btn button-positive mx-2">Play for Fun</Link> */}
          <button className="btn button-positive mx-2" onClick={() => onClickFindLobby(LOBBY_TYPES.CASUAL)}>Play For Fun</button>
          <button className={`btn button-positive mx-2 ${!user?.email ? "disabled" : ""}`} onClick={() => onClickFindLobby(LOBBY_TYPES.RANKED)}>Play For Rank</button>
        </div>

        <Link to={"/practice"}><button className="btn button-positive">Practice</button></Link>
      </div>

      <div className="loading-spinner">
        <LoadingSpinner spinnerText={loadingText} />
      </div>
    </>
  )
}