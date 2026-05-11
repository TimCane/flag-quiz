import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { clearToken } from "../../../lib/auth";
import { useActiveCollection } from "../../../lib/collection-context";

export function useLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { collection } = useActiveCollection();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  const prefix = `/${collection.id}`;
  const isPlaying = location.pathname === `${prefix}/play`;

  return { online, isPlaying, location, handleLogout, collection, prefix };
}
