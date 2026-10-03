import { createContext } from "react";

export const LoadingContext = createContext({
  isLoading: false,
  activeCount: 0,
  current: null,
  title: "",
  message: "",
});