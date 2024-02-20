import { useAppSelector } from "../redux/hooks"

export default function Home() {

  const user = useAppSelector(state => state.user);

  return (
    <>
      <h1>Rock Paper Scissor, Go!</h1>

      {user ?
        <h4>Welcome back, {user?.username}!</h4> :
        <h4>Play against others in Rock, Paper, Scissors and move up in rank!</h4>
      }

      <button>Play For Fun</button>
      <button>Play For Rank</button>
    </>
  )
}