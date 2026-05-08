import { useAuth } from "../context/AuthContext";

export function useAdmin() {
  const { admin, loading } = useAuth();
  return {
    isAdmin: !!admin,
    admin,
    loading,
  };
}
