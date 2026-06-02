import { createContext, useContext, useMemo, useState } from "react";
import {
  clearSession,
  getStoredUser,
  isAuthenticated as checkAuth,
  login as loginRequest,
  setSession,
  signup as signupRequest,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const stored = getStoredUser();
  const [user, setUser] = useState({
    username: stored.username || "",
    user_id: stored.user_id || null,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth());

  const login = async (credentials) => {
    const response = await loginRequest(credentials);
    if (response.status === 200) {
      setSession({
        token: response.data.token,
        username: response.data.username,
        user_id: response.data.user_id,
      });
      setUser({
        username: response.data.username,
        user_id: response.data.user_id,
      });
      setIsAuthenticated(true);
    }
    return response;
  };

  const signup = async (userData) => signupRequest(userData);

  const logout = () => {
    clearSession();
    setUser({ username: "", user_id: null });
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated, login, signup, logout }),
    [user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
