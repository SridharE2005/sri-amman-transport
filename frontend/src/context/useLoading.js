import { useContext } from "react";
import { LoadingContext } from "./loadingContext";

export const useLoading = () => useContext(LoadingContext);