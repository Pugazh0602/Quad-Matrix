import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionData } from "@/data/mockSessions";
import { Monitor, Smartphone, Tablet, Shield, AlertTriangle, Clock, User } from "lucide-react";

interface SessionCardProps {
  session: SessionData;
  onClick: () => void;
}

export const SessionCard = ({ session, onClick }: SessionCardProps) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    if (session.loginResult === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (session.logoutTime) {
      return <Badge variant="secondary">Ended</Badge>;
    }
    return <Badge className="bg-success text-success-foreground">Active</Badge>;
  };

  const getTwoFactorBadge = () => {
    if (session.twoFactorStatus === 'passed') {
      return <Badge variant="outline" className="text-success border-success">2FA ✓</Badge>;
    }
    if (session.twoFactorStatus === 'failed') {
      return <Badge variant="destructive">2FA ✗</Badge>;
    }
    return null;
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
              {getDeviceIcon(session.deviceType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{session.username}</h3>
                {session.suspiciousActivity && (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{session.userEmail}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge()}
            {getTwoFactorBadge()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{session.userRole}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(session.loginTime).toLocaleTimeString()}</span>
          </div>
          <div className="col-span-2 text-muted-foreground">
            <span className="font-mono">{session.ipAddress}</span>
            <span className="mx-2">•</span>
            <span>{session.location}</span>
          </div>
          {session.sessionDuration && (
            <div className="col-span-2 text-muted-foreground">
              Duration: <span className="font-medium">{session.sessionDuration}</span>
            </div>
          )}
          {session.failedReason && (
            <div className="col-span-2 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">{session.failedReason}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
