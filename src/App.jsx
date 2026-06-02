import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { UserProvider } from "./context/UserContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <SidebarProvider>
          <Router>
            <AppRoutes />
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                className: "font-sans",
                duration: 4000,
              }}
            />
          </Router>
        </SidebarProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
