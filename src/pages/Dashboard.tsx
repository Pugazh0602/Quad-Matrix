import { useState } from "react";
import { mockSessions, SessionData } from "@/data/mockSessions";
import { SessionCard } from "@/components/SessionCard";
import { SessionDetailsDialog } from "@/components/SessionDetailsDialog";
import { SessionFilters } from "@/components/SessionFilters";
import { StatsCards } from "@/components/StatsCards";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredSessions = mockSessions.filter((session) => {
    // Search filter
    const matchesSearch = 
      session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.ipAddress.includes(searchTerm);

    // Status filter
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = session.loginResult === "success" && !session.logoutTime;
    } else if (statusFilter === "ended") {
      matchesStatus = session.logoutTime !== null;
    } else if (statusFilter === "failed") {
      matchesStatus = session.loginResult === "failed";
    } else if (statusFilter === "suspicious") {
      matchesStatus = session.suspiciousActivity;
    }

    // Role filter
    const matchesRole =
      roleFilter === "all" ||
      session.userRole.toLowerCase() === roleFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleSessionClick = (session: SessionData) => {
    setSelectedSession(session);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Session Tracking Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitor login/logout activity and security events
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Statistics Cards */}
          <StatsCards sessions={mockSessions} />

          {/* Filters */}
          <div className="bg-card rounded-lg border p-4">
            <SessionFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
            />
          </div>

          {/* Session List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Session History ({filteredSessions.length})
            </h2>
            <div className="grid gap-4">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => handleSessionClick(session)}
                />
              ))}
              {filteredSessions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No sessions found matching your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SessionDetailsDialog
        session={selectedSession}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
