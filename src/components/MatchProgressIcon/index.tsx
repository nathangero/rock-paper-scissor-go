import { PLAYER_TYPES } from "../../utils/enums"

export default function MatchProgressIcon({ playerType }: MatchRoundIcon) {
  return (
    <>
      {playerType === PLAYER_TYPES.OTHER ?
        <>
          <div className="round-icon">
            <img src="/assets/circle-svgrepo-com.svg" width={30} alt="empty circle icon to show an unfinished round." />
          </div>
        </> :
        <>
          {playerType === PLAYER_TYPES.USER ?
            <div className="round-icon">
              <img src="/assets/crown-solid-svgrepo-com.svg" width={40} alt="crown icon for user winning a round." />
            </div> :
            <div className="round-icon">
              <img src="/assets/circle-close-svgrepo-com.svg" width={40} alt="circle with x icon for user losing a round." />
            </div>
          }
        </>
      }
    </>
  )
}

interface MatchRoundIcon {
  playerType: PLAYER_TYPES;
}