import { useState, useEffect } from "react";
import type { FlowInstanceSnapshot } from "@edgeflowjs/flow";
import Header from "./components/Header";
import WeatherWidget from "./components/WeatherWidget";
import StatusBar from "./components/StatusBar";
import Idle from "./screens/Idle";
import Scan from "./screens/Scan";
import Action from "./screens/Action";
import ThankYou from "./screens/ThankYou";
import Maintenance from "./screens/Maintenance";
import { getSnapshot, dispatch, subscribeFlow } from "./bridge/bridgeClient";

const INSTANCE_ID = "purchase-1";

export default function App() {
  const [screen, setScreen] = useState<"idle" | "scan" | "action" | "thankYou" | "maintenance">("idle");
  const [snapshot, setSnapshot] = useState<FlowInstanceSnapshot<unknown> | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsub = subscribeFlow(({ to }) => {
      const s = to as string;
      if (s === "idle" || s === "scan" || s === "action" || s === "thankYou") setScreen(s);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const s = await getSnapshot(INSTANCE_ID);
        setSnapshot(s);
        setConnected(true);
      } catch {
        setConnected(false);
      }
    }, 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (snapshot) {
      const s = snapshot.state as string;
      if (s === "idle" || s === "scan" || s === "action" || s === "thankYou") setScreen(s);
    }
  }, [snapshot]);

  const handleStart = async () => {
    await dispatch(INSTANCE_ID, { type: "START" });
  };
  const handleQR = async () => {
    await dispatch(INSTANCE_ID, { type: "QR_DETECTED" });
  };
  const handleComplete = async () => {
    await dispatch(INSTANCE_ID, { type: "COMPLETE" });
  };

  if (screen === "maintenance") {
    return (
      <div className="app">
        <Header />
        <main className="app__main app__main--full">
          <Maintenance onBack={() => setScreen((snapshot?.state as "idle" | "scan" | "action" | "thankYou") ?? "idle")} />
        </main>
        <StatusBar connected={connected} onMaintenance={() => setScreen("maintenance")} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <WeatherWidget />
      <main className="app__main">
        {screen === "idle" && <Idle onStart={handleStart} connected={connected} />}
        {screen === "scan" && <Scan onQR={handleQR} onCancel={() => dispatch(INSTANCE_ID, { type: "CANCEL" })} connected={connected} />}
        {screen === "action" && <Action onComplete={handleComplete} connected={connected} />}
        {screen === "thankYou" && <ThankYou />}
      </main>
      <StatusBar connected={connected} onMaintenance={() => setScreen("maintenance")} />
    </div>
  );
}
