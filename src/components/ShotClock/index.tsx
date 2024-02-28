import { useEffect, useState } from "react";

export default function ShotClock({ isActive, isBetweenRounds, onTimeout }: ShotClock) {
  const roundFullTime = 15; // 15 seconds
  const roundBetweenTime = 7; // The countdown between rounds

  const [seconds, setSeconds] = useState<number>(roundFullTime);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isActive) {
      console.log("timer stopped, starting again with", isBetweenRounds ? roundBetweenTime : roundFullTime, "seconds")
      setSeconds(isBetweenRounds ? roundBetweenTime : roundFullTime); // Reset the time limit when timer is stopped
      return;
    }

    if (seconds > 0) {
      timer = setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);
    } else if (seconds === 0) {
      console.log("time over!");
      onTimeout();
    }

    return () => clearTimeout(timer);
  }, [isActive, seconds, isBetweenRounds]);


  return (
    <>
      <h2>Time Remaining:</h2>
      <h3>{seconds}</h3>
    </>
  )
}

interface ShotClock {
  isActive: boolean;
  isBetweenRounds: boolean;
  onTimeout: () => void;
}