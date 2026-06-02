import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./AuthContext";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { user } = useAuth();

  const value = useMemo(
    () => ({
      username: user.username,
      userId: user.user_id,
    }),
    [user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
