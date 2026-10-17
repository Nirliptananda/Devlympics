import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <Loader fullScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
