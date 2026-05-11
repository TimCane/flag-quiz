import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { setToken } from "../../lib/auth";

export function useLogin() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { mutate, isPending, error, data } = useMutation({
    mutationFn: (pw: string) => api.login(pw),
    onSuccess: (res) => {
      if (res.ok && res.token) {
        setToken(res.token);
        navigate("/");
      }
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutate(password);
  }

  const displayError = error
    ? "Network error"
    : data && !data.ok
      ? data.error || "Login failed"
      : "";

  return {
    password,
    setPassword,
    error: displayError,
    loading: isPending,
    handleSubmit,
  };
}
