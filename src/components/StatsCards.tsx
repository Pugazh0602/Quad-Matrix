import { Card, CardContent } from "@/components/ui/card";
import { SessionData } from "@/data/mockSessions";
import { Users, Activity, AlertTriangle, CheckCircle } from "lucide-react";

interface StatsCardsProps {
  sessions: SessionData[];
}

export const StatsCards = ({ sessions }: StatsCardsProps) => {
  const activeSessions = sessions.filter(s => s.loginResult === 'success' && !s.logoutTime).length;
  const totalSessions = sessions.length;
  const failedLogins = sessions.filter(s => s.loginResult === 'failed').length;
  const suspiciousActivity = sessions.filter(s => s.suspiciousActivity).length;

  const StatCard = ({ icon: Icon, label, value, variant = 'default' }: any) => {
    const variantClasses = {
      default: 'bg-card',
      success: 'bg-success/10 border-success/20',
      warning: 'bg-warning/10 border-warning/20',
      destructive: 'bg-destructive/10 border-destructive/20',
    };

    return (
      <Card className={variantClasses[variant as keyof typeof variantClasses]}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{label}</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${
              variant === 'success' ? 'bg-success/20' :
              variant === 'warning' ? 'bg-warning/20' :
              variant === 'destructive' ? 'bg-destructive/20' :
              'bg-primary/20'
            }`}>
              <Icon className={`h-6 w-6 ${
                variant === 'success' ? 'text-success' :
                variant === 'warning' ? 'text-warning' :
                variant === 'destructive' ? 'text-destructive' :
                'text-primary'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        icon={Activity} 
        label="Active Sessions" 
        value={activeSessions} 
        variant="success"
      />
      <StatCard 
        icon={Users} 
        label="Total Sessions" 
        value={totalSessions} 
      />
      <StatCard 
        icon={CheckCircle} 
        label="Failed Logins" 
        value={failedLogins} 
        variant="destructive"
      />
      <StatCard 
        icon={AlertTriangle} 
        label="Suspicious Activity" 
        value={suspiciousActivity} 
        variant="warning"
      />
    </div>
  );
};
