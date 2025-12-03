import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

interface Session {
  sessionId: string;
  loginTime: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (token: string, user: User, session: Session) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedSession = localStorage.getItem("session");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // ignore
      }
    }

    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (e) {
        // ignore
      }
    }

    setIsLoading(false);
  }, []);

  const login = (_token: string, newUser: User, newSession: Session) => {
    setUser(newUser);
    setSession(newSession);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("session", JSON.stringify(newSession));
  };

  const logout = async () => {
    // Send logout update to close session on server
    try {
      if (session) {
        await fetch(`/api/sessions/${session.sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logoutTime: new Date(), status: "inactive" }),
          keepalive: true,
        });
      }
    } catch (e) {
      console.error("Logout error:", e);
    }

    setUser(null);
    setSession(null);
    localStorage.removeItem("user");
    localStorage.removeItem("session");
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
