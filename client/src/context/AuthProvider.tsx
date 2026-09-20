import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api, setAccessToken } from "../services/api";
import type { User } from "../types";
import { AuthContext } from "./AuthContext";
import {
  connectSocket,
  disconnectSocket,
  socket,
} from "../services/socket";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  function saveAccessToken(token: string | null) {
    setAccessTokenState(token);
    setAccessToken(token);
  }

  async function refreshSession(): Promise<boolean> {
    try {
      const response = await api.post("/auth/refresh");

      const token = response.data.data.accessToken;
      const refreshedUser = response.data.data.user;

      saveAccessToken(token);
      setUser(refreshedUser);

      return true;
    } catch {
      saveAccessToken(null);
      setUser(null);

      return false;
    }
  }

  async function login(email: string, password: string) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const token = response.data.data.accessToken;
    const loggedInUser = response.data.data.user;

    saveAccessToken(token);
    setUser(loggedInUser);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      saveAccessToken(null);
      setUser(null);
    }
  }

  /*
   * Initialize the authentication session
   * when the application first loads.
   */
  useEffect(() => {
    async function initializeAuth() {
      try {
        const response = await api.post("/auth/refresh");

        const token = response.data.data.accessToken;
        const refreshedUser = response.data.data.user;

        saveAccessToken(token);
        setUser(refreshedUser);
      } catch {
        saveAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void initializeAuth();
  }, []);

  /*
   * Connect Socket.IO whenever we have
   * a valid access token.
   *
   * Also listen for the server's initial
   * "connected" event so we can verify that
   * authenticated realtime communication works.
   */
  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    function handleConnected(data: { message: string }) {
      console.log(
        "Socket.IO connected:",
        data.message
      );
    }

    function handleConnectError(error: Error) {
      console.error(
        "Socket.IO connection error:",
        error.message
      );
    }

    socket.on("connected", handleConnected);
    socket.on(
      "connect_error",
      handleConnectError
    );

    connectSocket(accessToken);

    return () => {
      socket.off(
        "connected",
        handleConnected
      );

      socket.off(
        "connect_error",
        handleConnectError
      );

      disconnectSocket();
    };
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}