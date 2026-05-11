import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { clearToken } from "../../lib/auth";

export interface DeckSummary {
  id: string;
  name: string;
  description: string;
  groupLabel: string;
  flagCount: number;
  dueCount: number;
  newCount: number;
  sampleFlags: { code: string; name: string; ext: "png" | "svg" }[];
}

export function useDeckPicker() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["decks"],
    queryFn: () => api.get<{ ok: boolean; decks: DeckSummary[] }>("/decks"),
  });

  function handleLogout() {
    clearToken();
    navigate("/login");
  }

  return {
    decks: data?.decks ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    handleLogout,
  };
}
