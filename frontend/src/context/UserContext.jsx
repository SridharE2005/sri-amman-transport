// src/context/UserContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (u) => {
    if (!u) return null;
    const resolvedId = u._id || u.id;
    return { ...u, _id: resolvedId, id: resolvedId };
  };

  // On mount, if a token exists fetch the user profile from DB
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    API.get("/auth/me")
      .then(({ data }) => setUser(normalizeUser(data)))
      .catch(() => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData, remember = false) => {
    (remember ? localStorage : sessionStorage).setItem("token", token);
    setUser(normalizeUser(userData));
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(normalizeUser(updatedUser));

  return (
    <UserContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
