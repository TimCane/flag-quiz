import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { clearToken } from "../../../lib/auth";

export function useLayout() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isPlaying = location.pathname === "/play";

  return { online, isPlaying, location, handleLogout };
}
