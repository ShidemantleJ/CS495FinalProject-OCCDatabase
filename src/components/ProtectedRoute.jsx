import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function ProtectedRoute({ children }) {
  const {user, loading} = useUser();

  const isKiosk = sessionStorage.getItem("kioskMode") === "true"; //Check if in kiosk mode

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  // Stays in the mobile-interface if in kiosk mode
  if (isKiosk) {
    return <Navigate to="/mobile" replace />;
  }

  // Force login if no user or ephemeral session
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
