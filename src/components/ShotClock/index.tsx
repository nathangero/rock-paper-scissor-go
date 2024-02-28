import { useEffect, useState } from "react";

export default function ShotClock({ timeLimit, isActive, onTimeout }: ShotClock) {


  const [seconds, setSeconds] = useState<number>(timeLimit);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isActive) {
      console.log("timer stopped, starting again with", timeLimit, "seconds")
      setSeconds(timeLimit); // Reset the time limit when timer is stopped
      return;
    }

    console.log("started timer");
    if (seconds > 0) {
      timer = setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      console.log("time over!");
      onTimeout();
    }

    return () => clearTimeout(timer);
  }, [isActive, seconds]);


  return (
    <>
      <h2>Time Remaining:</h2>
      <h3>{seconds}</h3>
    </>
  )
}

interface ShotClock {
  timeLimit: number;
  isActive: boolean;
  onTimeout: () => void;
}