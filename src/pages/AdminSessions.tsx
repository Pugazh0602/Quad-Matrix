import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format, parseISO } from "date-fns";

interface User {
  name?: string;
  email?: string;
  username?: string;
}

interface Session {
  _id: string;
  userId: string;
  user?: User;
  startTime: string;
  endTime: string | null;
  deviceInfo: string;
  status: string;
  createdAt: string;
  workDone: string;
}

interface Stats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalHours: string;
  uniqueUsers: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const AdminSessions: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    fetchStats();
    fetchSessions(1);
  }, [filter]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/all-sessions/stats/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchSessions = async (page: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      let url = `http://localhost:5000/api/all-sessions?page=${page}&limit=50`;

      if (filter === "active") {
        url = `http://localhost:5000/api/all-sessions/active?page=${page}&limit=50`;
      } else if (filter === "completed") {
        url = `http://localhost:5000/api/all-sessions/completed?page=${page}&limit=50`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data.success) {
        setSessions(response.data.data || []);
        setPagination(response.data.pagination || null);
        setCurrentPage(page);
        setError("");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(parseISO(dateString), "yyyy-MM-dd");
    } catch {
      return "-";
    }
  };

  const formatRange = (startTime: string | null, endTime: string | null) => {
    if (!startTime) return "-";
    try {
      const start = format(parseISO(startTime), "hh:mm a");
      const end = endTime ? format(parseISO(endTime), "hh:mm a") : "Active";
      return `${start} to ${end}`;
    } catch {
      return "-";
    }
  };

  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return "Active";
    try {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const durationMs = end - start;
      if (durationMs < 0) return "Invalid";
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      return `${hours}h ${minutes}m ${seconds}s`;
    } catch {
      return "Invalid";
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (!session.user) return true;

    const userName = session.user?.name?.toLowerCase() || "";
    const userEmail = session.user?.email?.toLowerCase() || "";
    const userUsername = session.user?.username?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return (
      userName.includes(search) ||
      userEmail.includes(search) ||
      userUsername.includes(search)
    );
  });

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        "http://localhost:5000/api/admin/logout",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-blue-600">QuadMatrix</h2>
              <span className="ml-4 text-gray-600 text-sm">All Sessions</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm">Active Now</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeSessions}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-sm">Total Employees</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.uniqueUsers}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Sessions
              </button>

              <button
                onClick={() => setFilter("active")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "active"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Active Now
              </button>

              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "completed"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Completed
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Work Sessions ({filteredSessions.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <svg
                className="animate-spin h-12 w-12 text-blue-600 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="mt-4 text-gray-600">Loading sessions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr>
                    <th className="p-3 bg-gray-50 font-semibold text-gray-700 text-sm">
                      Employee
                    </th>
                    <th className="p-3 bg-gray-50 font-semibold text-gray-700 text-sm">
                      Date
                    </th>
                    <th className="p-3 bg-gray-50 font-semibold text-gray-700 text-sm">
                      Work Hours
                    </th>
                    <th className="p-3 bg-gray-50 font-semibold text-gray-700 text-sm">
                      Duration
                    </th>
                    <th className="p-3 bg-gray-50 font-semibold text-gray-700 text-sm">
                      Work Summary
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session._id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-medium text-gray-900">
                          {session.user?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.user?.email || "N/A"}
                        </p>
                      </td>

                      <td className="p-3 text-sm text-gray-700">
                        {formatDate(session.startTime)}
                      </td>

                      <td className="p-3 text-sm text-gray-700">
                        {formatRange(session.startTime, session.endTime)}
                      </td>

                      <td className="p-3 text-sm font-medium text-gray-900">
                        {calculateDuration(session.startTime, session.endTime)}
                      </td>

                      <td className="p-3 text-sm max-w-xs truncate">
                        {session.workDone || "N/A"}
                      </td>
                    </tr>
                  ))}

                  {filteredSessions.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-gray-500"
                      >
                        No sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => fetchSessions(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => fetchSessions(i + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => fetchSessions(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSessions;
