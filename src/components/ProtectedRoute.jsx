import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function ProtectedRoute({ children }) {
  const {user, loading} = useUser();

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  // Force login if no user or ephemeral session
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
