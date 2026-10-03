import { useEffect, useState } from "react";
import { subscribeToRequests } from "../services/requestTracker";
import { LoadingContext } from "./loadingContext";

export function LoadingProvider({ children }) {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    activeCount: 0,
    current: null,
    title: "Working on it",
    message: "Please wait while we complete your request.",
  });

  useEffect(() => subscribeToRequests(setLoadingState), []);

  return (
    <LoadingContext.Provider value={loadingState}>
      {children}
    </LoadingContext.Provider>
  );
}