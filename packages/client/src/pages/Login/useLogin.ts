import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";

export function useLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.login(password);
      if (res.ok && res.token) {
        setToken(res.token);
        navigate("/");
      } else {
        setError(res.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return { password, setPassword, error, loading, handleSubmit };
}
