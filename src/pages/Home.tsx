import { Link } from "react-router-dom";
import { Modal } from "bootstrap";
import { useAppSelector } from "../redux/hooks"
import { LOBBY_TYPES, ROUTER_LINKS } from "../utils/enums";
import { joinCasualLobby, searchCasualLobbies } from "../utils/rtdb";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect, useState } from "react";
import { LOBBY_KEYS } from "../utils/db-keys";
import { auth } from "../../firebase";

export default function Home() {

  const user = useAppSelector(state => state.user);

  const [loadingSpinner, setLoadingSpinner] = useState<Modal | null>(null);

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [lobbyType, setLobbyType] = useState<LOBBY_TYPES>(LOBBY_TYPES.CASUAL);

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
    const updatedLobby = { ...lobbyInfo, players: updatedPlayers, playersNum: playersNum + 1 }; 

    console.log("updatedLobby:", updatedLobby);

    let didJoin = false;
    switch (lobbyType) {
      case LOBBY_TYPES.CASUAL:
        didJoin = await joinCasualLobby(updatedLobby)
        break;

      case LOBBY_TYPES.RANKED:
        console.log("search for ranked")
        break;
    }

    if (didJoin) {
      console.log("MOVE USER TO LOBBY PAGE AND START THE MATCH")
    } else {
      console.log("Couldn't join the lobby. Could be full");
    }
  }

  // ************** ON CLICK ************** \\

  const onClickFindLobby = async (lobbyType: LOBBY_TYPES) => {
    try {
      setLobbyId(null);
      setIsSearching(true);
      setLobbyType(lobbyType);

      loadingSpinner?.show();

      switch (lobbyType) {
        case LOBBY_TYPES.CASUAL:
          joinLobby(lobbyType, await searchCasualLobbies());
          break;

        case LOBBY_TYPES.RANKED:
          console.log("search for ranked")
          break;
      }

    } catch (error) {
      console.log("Home.tsx couldn't search for casual lobbies");
      console.error(error);
      loadingSpinner?.hide();
    }

    setTimeout(() => {
      loadingSpinner?.hide();
    }, 1000);
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
        <LoadingSpinner spinnerText={"Finding Lobby..."} />
      </div>
    </>
  )
}