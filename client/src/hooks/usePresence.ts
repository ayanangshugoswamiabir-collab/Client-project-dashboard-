import { useEffect, useState } from "react";

import { socket } from "../services/socket";

export function usePresence() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    function handlePresenceUpdate(data: {
      onlineCount: number;
    }) {
      setOnlineCount(data.onlineCount);
    }

    socket.on(
      "presence:update",
      handlePresenceUpdate
    );

    return () => {
      socket.off(
        "presence:update",
        handlePresenceUpdate
      );
    };
  }, []);

  return onlineCount;
}