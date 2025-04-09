import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { JSX } from "react";

const PrivateRoute: React.FC<{ role: string; children: JSX.Element }> = ({ role, children }) => {
  const { user } = useAuth();
  if (!user || user.role !== role) return <Navigate to="/" />;
  return children;
};

export default PrivateRoute;