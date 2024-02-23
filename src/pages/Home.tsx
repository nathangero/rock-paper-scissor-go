import { Link } from "react-router-dom";
import { Modal } from "bootstrap";
import { useAppSelector } from "../redux/hooks"
import { LOBBY_TYPES, ROUTER_LINKS } from "../utils/enums";
import { searchCasualLobbies } from "../utils/rtdb";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect, useState } from "react";

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



  // ************** ON CLICK ************** \\

  const findLobby = async (lobbyType: LOBBY_TYPES) => {
    try {
      setLobbyId(null);
      setIsSearching(true);
      setLobbyType(lobbyType);

      loadingSpinner?.show();

      let lobbyId = "";
      switch (lobbyType) {
        case LOBBY_TYPES.CASUAL:
          lobbyId = await searchCasualLobbies();
          setLobbyId(lobbyId);
          break;

        case LOBBY_TYPES.RANKED:
          console.log("search for ranked")
          break;
      }

      if (lobbyId) {
        console.log("join the lobby");
      } else {
        console.log("need to create new lobby");
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
          <button className="btn button-positive mx-2" onClick={() => findLobby(LOBBY_TYPES.CASUAL)}>Play For Fun</button>
          <button className={`btn button-positive mx-2 ${!user?.email ? "disabled" : ""}`} onClick={() => findLobby(LOBBY_TYPES.RANKED)}>Play For Rank</button>
        </div>

        <Link to={"/practice"}><button className="btn button-positive">Practice</button></Link>
      </div>

      <div className="loading-spinner">
        <LoadingSpinner spinnerText={"Finding Lobby..."} />
      </div>
    </>
  )
}