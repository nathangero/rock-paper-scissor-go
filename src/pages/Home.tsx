import { Link, useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { useAppDispatch, useAppSelector } from "../redux/hooks"
import { LOBBY_TYPES, LOCAL_STORAGE_KEYS, ROUTER_LINKS } from "../utils/enums";
import { dbCreateLobby, dbGetLobbyPlayers, dbJoinLobby, dbJoinPrivateLobby, dbSearchLobbies } from "../utils/rtdb";
import LoadingSpinner from "../components/LoadingSpinner";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { LOBBY_KEYS } from "../utils/db-keys";
import { auth } from "../../firebase";
import { USER_ACTIONS } from "../redux/reducer";

export default function Home() {

  const user = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [loadingSpinner, setLoadingSpinner] = useState<Modal | null>(null);
  const [loadingText, setLoadingText] = useState<string>("Finding Lobby...")

  const [isPlayingCasual, setIsPlayingCasual] = useState<boolean>(false);
  const [isCreatingPrivate, setIsCreatingPrivate] = useState<boolean>(false);
  const [isJoiningPrivate, setIsJoiningPrivate] = useState<boolean>(false);

  const [privateLobbyId, setPrivateLobbyId] = useState<string>("");

  useEffect(() => {
    // Initialize bootstrap modals 
    const loadingSpinner = document.querySelector<HTMLDivElement>(".loading-spinner")?.querySelector<HTMLDivElement>("#modal-loading-spinner");
    if (loadingSpinner) setLoadingSpinner(new Modal(loadingSpinner));
  }, []);


  const joinLobby = async (lobbyType: LOBBY_TYPES, lobbyInfo: LobbyInfo) => {
    if (!lobbyInfo || Object.keys(lobbyInfo).length === 0) return;

    // Deconstruct variables
    const { [LOBBY_KEYS.PLAYERS]: players } = lobbyInfo;

    // Update players
    const updatedPlayers = { ...players, [user.username]: auth.currentUser?.uid };

    // Update players already in the lobby
    const playerNum = await dbGetLobbyPlayers(lobbyType, lobbyInfo[LOBBY_KEYS.ID]);

    // Updated Lobby
    const updatedLobby: any = { [LOBBY_KEYS.PLAYERS]: updatedPlayers, [LOBBY_KEYS.PLAYERS_NUM]: playerNum + 1 }; // eslint-disable-line @typescript-eslint/no-explicit-any

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
      // console.log("new lobby:", newLobby);
      if (newLobby) {
        joinLobbyHelper(lobbyType, newLobby);
      }
    } catch (error) {
      console.log("Couldn't create lobby");
      console.error(error);
      loadingSpinner?.hide();
    }
  }

  const joinLobbyHelper = (lobbyType: LOBBY_TYPES, lobbyInfo: LobbyInfo, lobbyId?: string) => {
    setTimeout(() => {
      loadingSpinner?.hide();

      // If needed, add the lobby id before adding it to the store
      if (lobbyId) lobbyInfo[LOBBY_KEYS.ID] = lobbyId;
      lobbyInfo[LOBBY_KEYS.TYPE] = lobbyType;

      dispatch({
        type: USER_ACTIONS.JOIN_LOBBY,
        lobby: lobbyInfo,
      })

      const lobbyStorage = {
        [LOBBY_KEYS.ID]: lobbyInfo[LOBBY_KEYS.ID],
        [LOBBY_KEYS.TYPE]: lobbyType,
      }

      localStorage.setItem(LOCAL_STORAGE_KEYS.LOBBY, JSON.stringify(lobbyStorage));
      navigate(`${ROUTER_LINKS.LOBBY}/${lobbyType}`);
    }, 1000);
  }


  const createPrivateLobby = async () => {
    try {
      setLoadingText("Creating private lobby...");
      loadingSpinner?.show();
      const userObj = { [user.username]: auth.currentUser?.uid };
      const newLobby = await dbCreateLobby(LOBBY_TYPES.PRIVATE, userObj, privateLobbyId);

      if (newLobby) {
        joinLobbyHelper(LOBBY_TYPES.PRIVATE, newLobby);
      }
    } catch (error) {
      console.log("Couldn't create private lobby");
      console.error(error);
    }
  }


  const joinPrivateLobby = async () => {
    try {
      setLoadingText("Joining private lobby...");
      loadingSpinner?.show();
      const userObj = { [user.username]: auth.currentUser?.uid };
      const privateLobby = await dbJoinPrivateLobby(privateLobbyId, userObj);

      if (privateLobby) {
        joinLobbyHelper(LOBBY_TYPES.PRIVATE, privateLobby, privateLobbyId);
      }
    } catch (error) {
      console.log("Couldn't join private lobby");
      console.error(error);
    }
  }

  // ON CHANGE

  const onChangePrivateLobbyId = ({ target }: ChangeEvent<HTMLInputElement>) => {
    setPrivateLobbyId(target.value);
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


  const onSubmitPrivateLobby = async (e: FormEvent)  => {
    e.preventDefault();
    e.stopPropagation();

    if (isCreatingPrivate) {
      await createPrivateLobby();
    }

    if (isJoiningPrivate) {
      await joinPrivateLobby();
    }
  }


  const onClickShowCreateLobbyId = () => {
    setPrivateLobbyId("");
    setIsCreatingPrivate(!isCreatingPrivate);
  }

  const onClickShowJoinLobbyId = () => {
    setPrivateLobbyId("");
    setIsJoiningPrivate(!isJoiningPrivate);
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
          <button className="btn button-positive mx-2" onClick={() => setIsPlayingCasual(!isPlayingCasual)}>Play For Fun</button>
          {isPlayingCasual ? null : <button className={`btn button-positive mx-2 ${!user?.email ? "disabled" : ""}`} onClick={() => onClickFindLobby(LOBBY_TYPES.RANKED)}>Play For Rank</button>}
        </div>

        {!isPlayingCasual ? null :
          <div className="d-flex flex-column align-items-center">
            <div className="d-flex flex-sm-row flex-column justify-content-center flex-wrap mb-3">
              <button className={`btn button-positive m-2 ${(isCreatingPrivate || isJoiningPrivate) ? "hidden" : ""}`} onClick={() => onClickFindLobby(LOBBY_TYPES.CASUAL)}>Find Casual Game</button>
              <button className={`btn button-positive m-2 ${isJoiningPrivate ? "hidden" : ""}`} onClick={() => onClickShowCreateLobbyId()}>Create Private Game</button>
              <button className={`btn button-positive m-2 ${isCreatingPrivate ? "hidden" : ""}`} onClick={() => onClickShowJoinLobbyId()}>Join Private Game</button>
            </div>

            {!isCreatingPrivate && !isJoiningPrivate ? null :
              <form onSubmit={onSubmitPrivateLobby}>
                <input className="form-control text-center" value={privateLobbyId} onChange={onChangePrivateLobbyId} placeholder="Lobby Code" />
                <button type="submit" className="btn button-positive m-2">{isCreatingPrivate ? "Create Lobby" : "Join Lobby" }</button>
              </form>
            }
          </div>
        }

        <hr />
        <Link to={"/practice"}><button className="btn button-positive">Practice</button></Link>
      </div>

      <div className="loading-spinner">
        <LoadingSpinner spinnerText={loadingText} />
      </div>
    </>
  )
}