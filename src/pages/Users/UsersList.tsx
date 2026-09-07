// src/pages/Users/UsersList.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import AuthService, {
  STATUS_LABELS,
  User,
  formatRoleLabel,
  KNOWN_ROLE_COLORS,
  DEFAULT_ROLE_COLOR,
} from "../../services/authService";
import { format } from "date-fns";
import { useAuth } from "../../hooks/useAuth";

export default function UsersList() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value actually sent to the API
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 15,
    total: 0,
  });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Role names for the filter dropdown, built once from an unfiltered pull
  // so it doesn't shrink to whatever happens to be on the current filtered page.
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // ==================== DEBOUNCE SEARCH ====================
  // ✅ FIX: the original fired an API call on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // ✅ FIX: reset to page 1 whenever a filter actually changes, otherwise a
  // narrower result set can leave you requesting a page that no longer exists.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setPagination((prev) =>
      prev.currentPage === 1 ? prev : { ...prev, currentPage: 1 },
    );
  }, [search, roleFilter, statusFilter]);

  // ==================== LOAD ROLE UNIVERSE (once) ====================
  useEffect(() => {
    (async () => {
      try {
        // Best-effort: the API has no dedicated "list roles" endpoint, so we
        // pull a large unfiltered page once just to seed the filter dropdown.
        const response = await AuthService.getUsers({ per_page: 200, page: 1 });
        if (response.success) {
          const roles = new Set<string>();
          (response.data.data as User[]).forEach((u) => {
            if (u.role) roles.add(u.role);
            u.roles?.forEach((r) => roles.add(r));
          });
          setAvailableRoles(Array.from(roles).sort());
        }
      } catch {
        // non-fatal — the role filter just won't have options yet
      }
    })();
  }, []);

  // ==================== LOAD USERS ====================

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AuthService.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: (statusFilter || undefined) as any,
        page: pagination.currentPage,
        per_page: pagination.perPage,
      });

      if (response.success) {
        const lastPage = response.data.last_page as number;

        // ✅ FIX: if the current page no longer exists (e.g. you deleted the
        // last item on the last page), fall back to the last valid page
        // instead of leaving the user stuck on a blank screen.
        if (lastPage > 0 && pagination.currentPage > lastPage) {
          setPagination((prev) => ({ ...prev, currentPage: lastPage }));
          return; // the effect below will re-fetch with the corrected page
        }

        setUsers(response.data.data);
        setPagination({
          currentPage: response.data.current_page,
          totalPages: response.data.last_page,
          perPage: response.data.per_page,
          total: response.data.total,
        });
        // Drop any selections that fell off the page
        setSelectedUsers((prev) =>
          prev.filter((id) =>
            (response.data.data as User[]).some((u) => u.id === id),
          ),
        );
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load users. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    search,
    roleFilter,
    statusFilter,
    pagination.currentPage,
    pagination.perPage,
  ]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    roleFilter,
    statusFilter,
    pagination.currentPage,
    pagination.perPage,
  ]);

  // ==================== SELECTION ====================
  // ✅ FIX: never let the current user select/act on their own row — the
  // backend rejects self-delete and self-status-change with a 403 anyway,
  // this just avoids the failed round trip.
  const selectableUsers = users.filter((u) => u.id !== currentUser?.id);

  const toggleSelectAll = () => {
    if (
      selectedUsers.length === selectableUsers.length &&
      selectableUsers.length > 0
    ) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(selectableUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: number) => {
    if (id === currentUser?.id) return;
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id],
    );
  };

  // ==================== DELETE USER ====================

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) return; // guarded in UI, but belt & braces

    const result = await Swal.fire({
      title: "Delete User?",
      text: `This will permanently delete "${user.full_name}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await AuthService.deleteUser(user.id);
      await loadUsers();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "User has been deleted.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to delete user.",
      });
    }
  };

  // ==================== BULK DELETE ====================

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    const result = await Swal.fire({
      title: `Delete ${selectedUsers.length} users?`,
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete All",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await AuthService.bulkDeleteUsers(selectedUsers);
      setSelectedUsers([]);
      await loadUsers();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: `Selected users have been deleted.`,
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to delete users.",
      });
    }
  };

  // ==================== UPDATE STATUS ====================

  const handleStatusChange = async (
    user: User,
    status: "active" | "inactive" | "banned",
  ) => {
    if (user.id === currentUser?.id) return;

    try {
      await AuthService.updateUserStatus(user.id, status);
      await loadUsers();
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `User status changed to ${STATUS_LABELS[status]}`,
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to update status.",
      });
    }
  };

  // ==================== RENDER HELPERS ====================

  const getStatusBadge = (status: string) => {
    const colors = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      inactive:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      banned: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getRoleBadge = (role: string) =>
    KNOWN_ROLE_COLORS[role] || DEFAULT_ROLE_COLOR;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage all users in your system
          </p>
        </div>
        <Link
          to="/users/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add User
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Roles</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {formatRoleLabel(role)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={loadUsers}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <span className="text-sm text-blue-600 dark:text-blue-400">
            {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""}{" "}
            selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedUsers([])}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === selectableUsers.length &&
                      selectableUsers.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Outlet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      Loading users...
                    </p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      No users found
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "You can't select your own account"
                              : undefined
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-30"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.first_name.charAt(0)}
                            {user.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.first_name} {user.last_name}
                              {isSelf && (
                                <span className="ml-2 text-xs text-gray-400">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.email || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)}`}
                        >
                          {formatRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}
                        >
                          {STATUS_LABELS[
                            user.status as keyof typeof STATUS_LABELS
                          ] || user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {user.outlet?.outlet_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/users/${user.id}`}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="View User"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            to={`/users/${user.id}/edit`}
                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Edit User"
                          >
                            <Edit size={18} />
                          </Link>
                          <div className="relative group">
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
                              disabled={isSelf}
                              title={
                                isSelf
                                  ? "You can't act on your own account here"
                                  : undefined
                              }
                            >
                              <MoreVertical size={18} />
                            </button>
                            {!isSelf && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 hidden group-hover:block">
                                {user.status !== "active" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(user, "active")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <UserCheck
                                      size={14}
                                      className="inline mr-2"
                                    />
                                    Set Active
                                  </button>
                                )}
                                {user.status !== "inactive" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(user, "inactive")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <UserX size={14} className="inline mr-2" />
                                    Set Inactive
                                  </button>
                                )}
                                {user.status !== "banned" && (
                                  <button
                                    onClick={() =>
                                      handleStatusChange(user, "banned")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <UserX size={14} className="inline mr-2" />
                                    Ban User
                                  </button>
                                )}
                                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Trash2 size={14} className="inline mr-2" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.currentPage - 1) * pagination.perPage + 1} to{" "}
              {Math.min(
                pagination.currentPage * pagination.perPage,
                pagination.total,
              )}{" "}
              of {pagination.total} users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage - 1,
                  }))
                }
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    currentPage: prev.currentPage + 1,
                  }))
                }
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
