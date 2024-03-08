import { Link, useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { useAppDispatch, useAppSelector } from "../redux/hooks"
import { LOBBY_TYPES, LOCAL_STORAGE_KEYS, ROUTER_LINKS } from "../utils/enums";
import { dbCheckPrivateLobby, dbCreateLobby, dbGetLobbyPlayers, dbJoinLobby, dbJoinPrivateLobby, dbSearchLobbies } from "../utils/rtdb";
import LoadingSpinner from "../components/LoadingSpinner";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { LOBBY_KEYS } from "../utils/db-keys";
import { auth } from "../../firebase";
import { USER_ACTIONS } from "../redux/reducer";
import Alert from "../components/Alert";

export default function Home() {
  const LOBBY_ID_REGEX = /^[a-zA-Z0-9-]+$/;
  const LOBBY_ID_LENGTH = 8; // Only allow up to 8 characters;

  const user = useAppSelector(state => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [modalAlert, setModalAlert] = useState<Modal | null>(null);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertBody, setAlertBody] = useState('');

  const [loadingSpinner, setLoadingSpinner] = useState<Modal | null>(null);
  const [loadingText, setLoadingText] = useState<string>("Finding Lobby...")

  const [isPlayingCasual, setIsPlayingCasual] = useState<boolean>(false);
  const [isCreatingPrivate, setIsCreatingPrivate] = useState<boolean>(false);
  const [isJoiningPrivate, setIsJoiningPrivate] = useState<boolean>(false);

  const [privateLobbyId, setPrivateLobbyId] = useState<string>("");
  const [isPrivateIdValid, setIsPrivateIdValid] = useState<boolean>(false);

  useEffect(() => {
    // Initialize bootstrap modals 
    const loadingSpinner = document.querySelector<HTMLDivElement>(".loading-spinner")?.querySelector<HTMLDivElement>("#modal-loading-spinner");
    if (loadingSpinner) setLoadingSpinner(new Modal(loadingSpinner));

    const modalLobbyExists = document.querySelector<HTMLDivElement>(".alert-modal-lobby-exists")?.querySelector<HTMLDivElement>("#alertModal");
    if (modalLobbyExists) setModalAlert(new Modal(modalLobbyExists));
  }, []);

  useEffect(() => {
    // Determine if the 
    const createJoinPrivateButton = document.getElementById("create-join-private-lobby");
    if (createJoinPrivateButton && isPrivateIdValid) createJoinPrivateButton.removeAttribute("disabled");
    else if (createJoinPrivateButton) createJoinPrivateButton.setAttribute("disabled", "");
  }, [isPrivateIdValid, isCreatingPrivate, isJoiningPrivate])


  const joinLobby = async (lobbyType: LOBBY_TYPES, lobbyInfo: LobbyInfo) => {
    if (!lobbyInfo || Object.keys(lobbyInfo).length === 0) return;

    // Deconstruct variables
    const { [LOBBY_KEYS.PLAYERS]: players } = lobbyInfo;

    // Update players
    const updatedPlayers = { ...players, [user.username]: auth.currentUser ? auth.currentUser?.uid : user.username };

    // Update players already in the lobby
    const playerNum = await dbGetLobbyPlayers(lobbyType, lobbyInfo[LOBBY_KEYS.ID]);

    // Updated Lobby
    const updatedLobby: any = { [LOBBY_KEYS.PLAYERS]: updatedPlayers, [LOBBY_KEYS.PLAYERS_NUM]: playerNum + 1 }; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get lobbyId
    const lobbyId = lobbyInfo[LOBBY_KEYS.ID];

    console.log("updatedLobby:", updatedLobby);

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
      const userObj = { [user.username]: auth.currentUser ? auth.currentUser?.uid : user.username };
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
      const userObj = { [user.username]: auth.currentUser ? auth.currentUser?.uid : user.username };
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
      const userObj = { [user.username]: auth.currentUser ? auth.currentUser?.uid : user.username };
      const privateLobby = await dbJoinPrivateLobby(privateLobbyId, userObj);

      if (privateLobby) {
        joinLobbyHelper(LOBBY_TYPES.PRIVATE, privateLobby, privateLobbyId);
      } else {
        loadingSpinner?.hide();
        setAlertTitle("Couldn't find lobby");
        setAlertBody("Lobby might not exist or code was incorrect.");
        modalAlert?.show();
      }
    } catch (error) {
      console.log("Couldn't join private lobby");
      console.error(error);
    }
  }

  // ************** ON CHANGE ************** \\

  const onChangePrivateLobbyId = ({ target }: ChangeEvent<HTMLInputElement>) => {
    const id = target.value;
    if (!LOBBY_ID_REGEX.test(id)) setIsPrivateIdValid(false); // Tell user the code isn't valid
    else if (id.length > LOBBY_ID_LENGTH) return; // Prevent going over 8 characters
    else setIsPrivateIdValid(true); // Code is valid if above cases fall through

    setPrivateLobbyId(id);
  }

  // ************** ON CLICK ************** \\

  const onClickFindLobby = async (lobbyType: LOBBY_TYPES) => {
    /**
     * TODO: Make random usernames for people who don't have accounts.
     * ✅ in the db, their username is also their id.
     * ✅ Make a check with auth.currentUser to prevent stats being updated for non existent users
     * Make special text saying being logged in lets you see your stats and eventually ranked.
     */

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
            loadingSpinner?.hide();
            setAlertTitle("Feature not implemented yet");
            setAlertBody("Please wait for a future update! :)");
            modalAlert?.show();
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


  const onSubmitPrivateLobby = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCreatingPrivate) {
      loadingSpinner?.show();
      const lobbyAlreadyExists = await dbCheckPrivateLobby(privateLobbyId);
      if (!lobbyAlreadyExists) await createPrivateLobby();
      else {
        loadingSpinner?.hide();
        setAlertTitle("Lobby Already Exists");
        setAlertBody("Please create a different lobby code");
        modalAlert?.show();
      }

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

      <div className="mb-3">
        <h4 className="mb-3">Play against others in Rock, Paper, Scissors and move up in rank!</h4>
        <h4 className="mb-2">{auth.currentUser ? `Welcome back ${user?.username}` : "Welcome"}!</h4>
        {auth.currentUser ? null : <p>If you log in, you can keep track of your stats and play ranked (when ready).</p>}
      </div>

      <div>
        <div className="mb-2">
          <button className="btn button-positive mx-2" onClick={() => setIsPlayingCasual(!isPlayingCasual)}>Play For Fun</button>
          {isPlayingCasual ? null : <button className={`btn button-positive mx-2 ${!user?.email ? "disabled" : ""}`} onClick={() => onClickFindLobby(LOBBY_TYPES.RANKED)} disabled >Play For Rank</button>}
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
                <input className="form-control text-center private-lobby-code" value={privateLobbyId} onChange={onChangePrivateLobbyId} placeholder="Lobby Code" />
                <p className="m-2">*Code must be 1-8 characters and only include letters, numbers, and dashes</p>
                {isPrivateIdValid ? null : <p className="text-danger fs-3">Code is not valid.</p>}
                <button id="create-join-private-lobby" type="submit" className="btn button-positive m-2" disabled>{isCreatingPrivate ? "Create Lobby" : "Join Lobby"}</button>
              </form>
            }
          </div>
        }

        <hr />
        <Link to={"/practice"}><button className="btn button-positive">Practice</button></Link>
      </div>


      <div className="alert-modal-lobby-exists">
        <Alert title={alertTitle} body={alertBody} />
      </div>

      <div className="loading-spinner">
        <LoadingSpinner spinnerText={loadingText} />
      </div>
    </>
  )
}