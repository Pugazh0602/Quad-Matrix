import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Employee {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  department?: string;
  createdAt: string;
  lastLogin: string;
}

interface Session {
  _id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  deviceInfo: string;
  status: string;
  createdAt: string;
}

interface EmployeeStats {
  employee: Employee;
  stats: {
    totalSessions: number;
    activeSessions: number;
    totalHours: string;
    lastLogin: string;
  };
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  lastLogin: string;
  createdAt: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeStats | null>(null);
  const [employeeSessions, setEmployeeSessions] = useState<Session[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (! token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    fetchAdminProfile(token);
  }, [navigate]);

  const fetchAdminProfile = async (token: string) => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/admin/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setAdmin(response.data.admin);
      } else {
        setError("Failed to load profile");
        navigate("/admin/login", { replace: true });
      }
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        navigate("/admin/login", { replace: true });
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        "http://localhost:5000/api/employees",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setEmployees(response.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      setError("Failed to fetch employees");
    } finally {
      setEmployeesLoading(false);
    }
  };

  const fetchEmployeeStats = async (employeeId: string) => {
    try {
      const token = localStorage. getItem("adminToken");
      const response = await axios.get(
        `http://localhost:5000/api/employees/${employeeId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setSelectedEmployee(response.data.data);
        fetchEmployeeSessions(employeeId);
        setShowEmployeeModal(true);
      }
    } catch (err: any) {
      console.error("Error fetching employee stats:", err);
      setError("Failed to fetch employee details");
    }
  };

  const fetchEmployeeSessions = async (employeeId: string) => {
    setSessionsLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios. get(
        `http://localhost:5000/api/employees/${employeeId}/sessions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setEmployeeSessions(response.data. data || []);
      }
    } catch (err: any) {
      console.error("Error fetching sessions:", err);
      setError("Failed to fetch session history");
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleViewAllUsers = async () => {
    await fetchAllEmployees();
  };

  const handleLogout = async () => {
    try {
      const token = localStorage. getItem("adminToken");
      await axios.post(
        "http://localhost:5000/api/admin/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("adminToken");
      localStorage. removeItem("adminUser");
      navigate("/admin/login", { replace: true });
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return "-";
    }
  };

  const formatDateShort = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "-";
    }
  };

  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return "Active";
    try {
      const start = new Date(startTime). getTime();
      const end = new Date(endTime).getTime();
      const durationMs = end - start;
      if (durationMs < 0) return "Invalid";
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
      return `${hours}h ${minutes}m ${seconds}s`;
    } catch (e) {
      return "Invalid";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto"
            xmlns="http://www.w3. org/2000/svg"
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h2 className="text-2xl font-bold text-blue-600">QuadMatrix</h2>
              <span className="ml-4 text-gray-600 text-sm">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{admin?.username}</p>
                <p className="text-xs text-gray-500">{admin?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
              >
                Logout
              </button>
            </div>
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Admin Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Admin Profile
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Username
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {admin?.username}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {admin?.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Role
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {admin?.role?. replace("_", " ").toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Permissions
            </h3>
            <div className="space-y-2">
              {admin?.permissions.map((permission, index) => (
                <div
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full mr-2 mb-2"
                >
                  {permission}
                </div>
              ))}
            </div>
          </div>

          {/* Account Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Account Status
            </h3>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-900">Active</span>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Status
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Last Login</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(admin?.lastLogin)}
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dashboard Features
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-gray-700">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                User Management
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Session Tracking
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Logs & Analytics
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Security Monitoring
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleViewAllUsers}
                disabled={employeesLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center justify-center"
              >
                {employeesLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3. org/2000/svg"
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
                    Loading...
                  </>
                ) : (
                  "View All Employees"
                )}
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
                View Sessions
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
                View Logs
              </button>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200">
                System Settings
              </button>
            </div>
          </div>
        </div>

        {/* Employees List Table */}
        {employees.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Employees ({employees.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {employee.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {employee.department || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => fetchEmployeeStats(employee._id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Employee Details Modal */}
        {showEmployeeModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
              <div className="px-6 py-4 bg-blue-600 flex justify-between items-center sticky top-0">
                <h2 className="text-xl font-bold text-white">
                  Employee Details - {selectedEmployee.employee.name}
                </h2>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Employee Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedEmployee.employee.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-base font-medium text-gray-900 break-all">
                        {selectedEmployee. employee.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Username</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedEmployee.employee.username}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedEmployee.employee.department || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Work Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Sessions</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedEmployee.stats.totalSessions}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Active Sessions</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedEmployee.stats. activeSessions}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Total Hours</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedEmployee.stats. totalHours}h
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="text-sm font-medium text-orange-600">
                        {formatDateShort(selectedEmployee.stats.lastLogin)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Login History Table */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Login History ({employeeSessions.length})
                  </h3>
                  {sessionsLoading ? (
                    <div className="flex justify-center py-8">
                      <svg
                        className="animate-spin h-8 w-8 text-blue-600"
                        xmlns="http://www.w3. org/2000/svg"
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
                    </div>
                  ) : employeeSessions.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                              Login Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                              Logout Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                              Duration
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                              Device
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {employeeSessions.map((session) => (
                            <tr key={session._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                                {formatDate(session.startTime)}
                              </td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                {formatDate(session. endTime) || "-"}
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                                {calculateDuration(session.startTime, session.endTime)}
                              </td>
                              <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                                {session.deviceInfo || "Unknown"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                    ! session.endTime
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {! session.endTime ? "Active" : "Completed"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No login history available</p>
                    </div>
                  )}
                </div>

                {/* Account Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Role</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedEmployee. employee.role}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-base font-medium text-gray-900">
                        {formatDateShort(selectedEmployee.employee. createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end sticky bottom-0">
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;