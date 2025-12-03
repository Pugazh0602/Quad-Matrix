import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SessionData } from "@/data/mockSessions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Monitor, Globe, Clock, User, Key, AlertTriangle } from "lucide-react";

interface SessionDetailsDialogProps {
  session: SessionData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionDetailsDialog = ({ session, open, onOpenChange }: SessionDetailsDialogProps) => {
  if (!session) return null;

  const DetailRow = ({ icon: Icon, label, value, className = "" }: any) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${className}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Session Details
            {session.suspiciousActivity && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Suspicious Activity
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              User Information
            </h3>
            <div className="space-y-1">
              <DetailRow icon={User} label="User ID" value={session.userId} />
              <DetailRow icon={User} label="Email" value={session.userEmail} />
              <DetailRow icon={User} label="Username" value={session.username} />
              <DetailRow 
                icon={Shield} 
                label="Role" 
                value={
                  <Badge variant={session.userRole === 'Admin' ? 'default' : 'secondary'}>
                    {session.userRole}
                  </Badge>
                }
              />
              <DetailRow 
                icon={Shield} 
                label="Account Status" 
                value={
                  <Badge 
                    variant={session.accountStatus === 'Active' ? 'outline' : 'destructive'}
                    className={session.accountStatus === 'Active' ? 'text-success border-success' : ''}
                  >
                    {session.accountStatus}
                  </Badge>
                }
              />
            </div>
          </div>

          <Separator />

          {/* Session Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Session Information
            </h3>
            <div className="space-y-1">
              <DetailRow 
                icon={Clock} 
                label="Login Time" 
                value={new Date(session.loginTime).toLocaleString()} 
              />
              <DetailRow 
                icon={Clock} 
                label="Logout Time" 
                value={session.logoutTime ? new Date(session.logoutTime).toLocaleString() : 'Still active'} 
              />
              <DetailRow 
                icon={Clock} 
                label="Session Duration" 
                value={session.sessionDuration || 'Ongoing'} 
              />
              <DetailRow icon={Key} label="Session ID" value={session.sessionId} />
            </div>
          </div>

          <Separator />

          {/* Device Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Device Information
            </h3>
            <div className="space-y-1">
              <DetailRow icon={Monitor} label="Device Type" value={session.deviceType} />
              <DetailRow icon={Monitor} label="Operating System" value={session.operatingSystem} />
              <DetailRow icon={Monitor} label="Browser" value={session.browser} />
            </div>
          </div>

          <Separator />

          {/* Network Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Network Information
            </h3>
            <div className="space-y-1">
              <DetailRow icon={Globe} label="IP Address" value={session.ipAddress} />
              <DetailRow icon={Globe} label="Location" value={session.location} />
            </div>
          </div>

          <Separator />

          {/* Security Information */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Information
            </h3>
            <div className="space-y-1">
              <DetailRow 
                icon={Shield} 
                label="Login Result" 
                value={
                  <Badge 
                    variant={session.loginResult === 'success' ? 'outline' : 'destructive'}
                    className={session.loginResult === 'success' ? 'text-success border-success' : ''}
                  >
                    {session.loginResult}
                  </Badge>
                }
              />
              {session.logoutResult && (
                <DetailRow icon={Shield} label="Logout Result" value={session.logoutResult} />
              )}
              {session.failedReason && (
                <DetailRow 
                  icon={AlertTriangle} 
                  label="Failed Reason" 
                  value={session.failedReason}
                  className="text-destructive"
                />
              )}
              <DetailRow 
                icon={Shield} 
                label="2FA Status" 
                value={
                  <Badge 
                    variant={session.twoFactorStatus === 'passed' ? 'outline' : 
                            session.twoFactorStatus === 'failed' ? 'destructive' : 'secondary'}
                    className={session.twoFactorStatus === 'passed' ? 'text-success border-success' : ''}
                  >
                    {session.twoFactorStatus === 'passed' ? 'Passed' : 
                     session.twoFactorStatus === 'failed' ? 'Failed' : 'Not Required'}
                  </Badge>
                }
              />
              <DetailRow icon={Key} label="Token ID" value={session.tokenId} />
              <DetailRow 
                icon={AlertTriangle} 
                label="Suspicious Activity" 
                value={
                  <Badge variant={session.suspiciousActivity ? 'destructive' : 'outline'}>
                    {session.suspiciousActivity ? 'Yes' : 'No'}
                  </Badge>
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
