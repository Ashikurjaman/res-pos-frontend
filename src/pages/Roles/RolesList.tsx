// src/pages/Roles/RolesList.tsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import RoleService, { RoleData } from "../../services/roleService";

export default function RolesList() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await RoleService.getRoles({
        search: search || undefined,
        page: pagination.currentPage,
        per_page: 15,
      });

      console.log("Roles API Response:", response); // ✅ Debug log

      if (response.success) {
        // ✅ Ensure permissions is always an array
        const rolesData = response.data.data.map((role: any) => ({
          ...role,
          permissions: role.permissions || [],
        }));
        setRoles(rolesData);

        setPagination({
          currentPage: response.data.current_page,
          totalPages: response.data.last_page,
          total: response.data.total,
        });
      }
    } catch (error: any) {
      console.error("Failed to load roles:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to load roles.",
      });
    } finally {
      setLoading(false);
    }
  }, [search, pagination.currentPage]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleDelete = async (role: RoleData) => {
    if (role.name === "superadmin") {
      Swal.fire({
        icon: "warning",
        title: "Protected Role",
        text: "Super Admin role cannot be deleted.",
      });
      return;
    }

    if (role.users_count > 0) {
      Swal.fire({
        icon: "warning",
        title: "Cannot Delete",
        text: `This role is assigned to ${role.users_count} user(s). Reassign them before deleting.`,
      });
      return;
    }

    const result = await Swal.fire({
      title: "Delete Role?",
      text: `Are you sure you want to delete "${role.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await RoleService.deleteRole(role.id);
      await loadRoles();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error.message || "Failed to delete role.",
      });
    }
  };

  const formatLabel = (name: string) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1) : "";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage roles and their permissions dynamically.
          </p>
        </div>
        <Link
          to="/roles/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add Role
        </Link>
      </div>

      {/* Search + Refresh */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <button
          onClick={loadRoles}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      Loading roles...
                    </p>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="mt-2 text-gray-500 dark:text-gray-400">
                      No roles found
                    </p>
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Shield
                            size={16}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatLabel(role.name)}
                          </p>
                          {role.name === "superadmin" && (
                            <span className="text-xs text-gray-400">
                              Protected
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {/* ✅ Safe check for permissions */}
                        {role.permissions && role.permissions.length > 0 ? (
                          <>
                            {role.permissions.slice(0, 4).map((perm) => (
                              <span
                                key={perm}
                                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              >
                                {perm}
                              </span>
                            ))}
                            {role.permissions.length > 4 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                +{role.permissions.length - 4} more
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No permissions
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {role.users_count || 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/roles/${role.id}/edit`}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Edit Role"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(role)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete Role"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && roles.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.currentPage} of {pagination.totalPages} (
              {pagination.total} roles)
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
