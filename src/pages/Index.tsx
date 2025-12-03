import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Activity, Lock, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Quadmatrix
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Quadmatrix login/logout tracking and security monitoring system. 
              Track user sessions, and maintain comprehensive audit logs.
            </p>
          </div>

          {/* Features Grid */}
          {/* <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Real-time Monitoring</h3>
                    <p className="text-muted-foreground">
                      Track active sessions, login attempts, and user activity in real-time with instant alerts.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Security Analysis</h3>
                    <p className="text-muted-foreground">
                      Detect suspicious activity, track failed login attempts, and monitor 2FA status.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Comprehensive Logs</h3>
                    <p className="text-muted-foreground">
                      Complete audit trail with device info, network details, and session metadata.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Role-Based Access</h3>
                    <p className="text-muted-foreground">
                      Filter and track sessions by user roles with granular permission controls.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* CTA Section */}
          <div className="text-center space-y-4">
            {/* <Button 
              size="lg" 
              onClick={() => navigate("/dashboard")}
              className="text-lg px-8 py-6 h-auto mr-4"
            >
              View Dashboard
            </Button> */}
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/login")}
              className="text-lg px-8 py-6 h-auto"
            >
             Employee Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
