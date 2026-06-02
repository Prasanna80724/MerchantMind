import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../pages/Auth/Login/Login";
import Signup from "../pages/Auth/Signup/Signup";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import InventoryPage from "../pages/Inventory/InventoryPage";
import SalesPage from "../pages/Sales/SalesPage";
import SupplierPage from "../pages/Suppliers/SupplierPage";
import InvoicePage from "../pages/Invoices/InvoicePage";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory"
      element={
        <ProtectedRoute>
          <InventoryPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/sales"
      element={
        <ProtectedRoute>
          <SalesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/suppliers"
      element={
        <ProtectedRoute>
          <SupplierPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/invoices"
      element={
        <ProtectedRoute>
          <InvoicePage />
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default AppRoutes;
