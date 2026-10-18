import { useCallback, useState } from "react";

// Captures the device location. The design requires the agent to stand at the CENTRE of the farm
// when pressing the button, and the result must show accuracy (metres) and a timestamp.
export default function useGps() {
  const [gps, setGps] = useState({ status: "idle", message: "Not captured yet · Awaiting device permission" });

  const capture = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGps({ status: "error", message: "Location is not available on this device." });
      return;
    }
    setGps({ status: "waiting", message: "Getting your location…" });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGps({
          status: "ok",
          latitude,
          longitude,
          accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
          message: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (± ${Math.round(accuracy)} m)`,
        });
      },
      () => setGps({ status: "error", message: "Location permission denied or unavailable. Please retry." }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  return { gps, capture };
}
