import { createContext, useContext, useMemo, useState } from "react";

const SidebarContext = createContext(null);

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const value = useMemo(
    () => ({ collapsed, setCollapsed, toggle: () => setCollapsed((c) => !c) }),
    [collapsed]
  );
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
};
