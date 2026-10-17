import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api/index.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("sparkmatch_token"));
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("sparkmatch_token")));

  useEffect(() => {
    let active = true;
    const storedToken = localStorage.getItem("sparkmatch_token");
    if (!storedToken) {
      setLoading(false);
      return () => { active = false; };
    }

    api.getMe()
      .then((result) => {
        if (!active) return;
        setToken(storedToken);
        setUser(result.user);
        setProfile(result.profile);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("sparkmatch_token");
        setToken(null);
        setUser(null);
        setProfile(null);
        navigate("/login", { replace: true });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [navigate]);

  const establishSession = useCallback((result) => {
    localStorage.setItem("sparkmatch_token", result.token);
    setToken(result.token);
    setUser(result.user);
    setProfile(result.profile);
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const loginUser = useCallback(async (credentials) => {
    establishSession(await api.login(credentials));
  }, [establishSession]);

  const registerUser = useCallback(async (payload) => {
    establishSession(await api.register(payload));
  }, [establishSession]);

  const logoutUser = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Clearing the local session must work even if the API is unavailable.
    }
    localStorage.removeItem("sparkmatch_token");
    setToken(null);
    setUser(null);
    setProfile(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const refreshProfile = useCallback(async () => {
    const result = await api.getMe();
    setUser(result.user);
    setProfile(result.profile);
    return result.profile;
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    token,
    loading,
    loginUser,
    registerUser,
    logoutUser,
    refreshProfile,
  }), [user, profile, token, loading, loginUser, registerUser, logoutUser, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
