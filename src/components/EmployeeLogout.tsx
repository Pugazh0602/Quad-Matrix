import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const EmployeeLogout: React.FC = () => {
  const { session, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);
    try {
      if (session) {
        await fetch(`/api/sessions/${session.sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logoutTime: new Date(), status: "inactive" }),
          keepalive: true,
        });
      }
      toast.success("Session ended");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Logout error");
    } finally {
      logout();
      setLoading(false);
      navigate("/login");
    }
  };

  return (
    <Button variant="ghost" onClick={handleLogout} disabled={loading}>
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
};

export default EmployeeLogout;
