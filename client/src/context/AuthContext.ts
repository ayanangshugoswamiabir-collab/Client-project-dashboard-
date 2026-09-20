import { createContext } from "react";
import type { User } from "../types";

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

export const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);