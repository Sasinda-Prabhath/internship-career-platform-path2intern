import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true while restoring session

    // Restore session on mount by calling /api/auth/me
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get("/api/auth/me", { timeout: 5000 }); // 5 second timeout
                setUser(res.data.user);
            } catch (error) {
                console.log("Auth check failed:", error.message);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post("/api/auth/logout");
        } catch {
            // even if server call fails, clear local state
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
