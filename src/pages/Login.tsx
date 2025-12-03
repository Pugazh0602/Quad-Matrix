import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Mail } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);

    try {
      // Fetch user from database to verify they exist
      const userRes = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!userRes.ok || userRes.status === 404) {
        toast.error("User not found. Please enter a valid email.");
        setIsLoading(false);
        return;
      }

      const userData = await userRes.json();
      if (!userData || !userData._id) {
        toast.error("User not found");
        setIsLoading(false);
        return;
      }

      // Create a session record
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const loginTime = new Date();
      
      const sessionData = {
        sessionId,
        userId: userData._id,
        loginTime,
        logoutTime: null,
        ipAddress: "local",
        userAgent: navigator.userAgent,
        deviceType: "web",
        os: navigator.platform,
        browser: "web",
        location: "Local",
        status: "active",
      };

      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (!sessionRes.ok) {
        toast.error("Failed to start session");
        return;
      }

      // Store session in auth context
      login("", 
        { 
          id: userData._id, 
          email: userData.email, 
          username: userData.firstName || userData.email 
        }, 
        { sessionId, loginTime: loginTime.toISOString() }
      );
      toast.success("Session started!");
      navigate("/employee");
    } catch (error) {
      toast.error("An error occurred");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <Card className="border-2">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">QuadMatrix</CardTitle>
            <CardDescription>
              Work Session Tracker
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Starting..." : "Start Work Session"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
