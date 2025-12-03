import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInSeconds } from "date-fns";

interface SessionRow {
  _id: string;
  userId: string;
  loginTime: string;
  logoutTime: string | null;
  status: string;
}

const EmployeeHome: React.FC = () => {
  const { user, session, logout } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ userId: user.id });
        const res = await fetch(`/api/sessions?${params.toString()}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setRows(data);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  const formatRange = (login: string, logout: string | null) => {
    try {
      const inTime = parseISO(login);
      const inStr = format(inTime, "hh:mm a");
      const outStr = logout ? format(parseISO(logout), "hh:mm a") : "(active)";
      return `${inStr} to ${outStr}`;
    } catch (e) {
      return "-";
    }
  };

  const calculateDuration = (login: string, logout: string | null) => {
    try {
      if (!logout) return "-";
      const inTime = parseISO(login);
      const outTime = parseISO(logout);
      const seconds = differenceInSeconds(outTime, inTime);
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}h ${minutes}m ${secs}s`;
    } catch (e) {
      return "-";
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.username || "Employee"}</h1>
            <p className="text-muted-foreground">Work Session: {session?.sessionId.slice(0, 12)}...</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="destructive" onClick={handleLogout}>
              End Session & Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-4">Previous Logins</h2>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr>
                    <th className="text-left p-2">Employee</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Work Hours</th>
                    <th className="text-left p-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="p-2">{r.userId}</td>
                      <td className="p-2">{format(parseISO(r.loginTime), "yyyy-MM-dd")}</td>
                      <td className="p-2">{formatRange(r.loginTime, r.logoutTime)}</td>
                      <td className="p-2">{calculateDuration(r.loginTime, r.logoutTime)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeHome;
