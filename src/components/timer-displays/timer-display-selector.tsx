import {
  CounterDisplay,
  CircularDisplay,
  ProgressDisplay,
  MinimalDisplay,
  DigitalDisplay,
} from "./index";

export type DisplayType =
  | "counter"
  | "circular"
  | "progress"
  | "minimal"
  | "digital";

interface TimerDisplaySelectorProps {
  minutes: number;
  seconds: number;
  totalMinutes: number;
  displayType: DisplayType;
}

export default function TimerDisplaySelector({
  minutes,
  seconds,
  totalMinutes,
  displayType,
}: TimerDisplaySelectorProps) {
  const renderDisplay = () => {
    switch (displayType) {
      case "counter":
        return <CounterDisplay minutes={minutes} seconds={seconds} />;
      case "circular":
        return (
          <CircularDisplay
            minutes={minutes}
            seconds={seconds}
            totalMinutes={totalMinutes}
          />
        );
      case "progress":
        return (
          <ProgressDisplay
            minutes={minutes}
            seconds={seconds}
            totalMinutes={totalMinutes}
          />
        );
      case "minimal":
        return <MinimalDisplay minutes={minutes} seconds={seconds} />;
      case "digital":
        return <DigitalDisplay minutes={minutes} seconds={seconds} />;
      default:
        return <CounterDisplay minutes={minutes} seconds={seconds} />;
    }
  };

  return <div className="flex justify-center">{renderDisplay()}</div>;
}
