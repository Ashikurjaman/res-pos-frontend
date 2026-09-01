// src/pages/Roles/RoleFormPage.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Swal from "sweetalert2";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import RoleService from "../../services/roleService";

const roleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be less than 50 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Role name can only contain lowercase letters, numbers, and underscores",
    ),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface PermissionGroup {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
  permissions: string[];
  is_protected?: boolean;
}

export default function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const roleId = id ? parseInt(id, 10) : undefined;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isProtected, setIsProtected] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<
    Record<string, PermissionGroup[]>
  >({});
  const [checkedPermissions, setCheckedPermissions] = useState<
    Record<string, boolean>
  >({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "" },
  });

  // ==================== LOAD DATA ====================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        // Load permissions list
        const permResponse = await RoleService.getPermissionsList();
        console.log("Permissions response:", permResponse);

        // ✅ Handle different response structures more robustly
        let groups: Record<string, PermissionGroup[]> = {};

        // Check if response exists
        if (permResponse) {
          // If response has data property
          if (permResponse.data) {
            // If data is an object with groups
            if (
              typeof permResponse.data === "object" &&
              !Array.isArray(permResponse.data)
            ) {
              groups = permResponse.data;
            }
            // If data is an array
            else if (Array.isArray(permResponse.data)) {
              // Try to group by category if permissions have a 'group' or 'category' field
              const perms = permResponse.data;
              if (perms.length > 0) {
                // If permissions have a 'group' field
                if (perms[0].group || perms[0].category) {
                  const grouped: Record<string, PermissionGroup[]> = {};
                  perms.forEach((p: any) => {
                    const groupKey = p.group || p.category || "general";
                    if (!grouped[groupKey]) {
                      grouped[groupKey] = [];
                    }
                    grouped[groupKey].push({ id: p.id, name: p.name });
                  });
                  groups = grouped;
                } else {
                  // Put all in 'all' group
                  groups = {
                    all: perms.map((p: any) => ({ id: p.id, name: p.name })),
                  };
                }
              }
            }
          }
          // If response itself is an object with groups
          else if (
            typeof permResponse === "object" &&
            !Array.isArray(permResponse)
          ) {
            // Check if it has group keys
            const keys = Object.keys(permResponse);
            if (keys.length > 0 && Array.isArray(permResponse[keys[0]])) {
              groups = permResponse;
            }
          }
          // If response is an array
          else if (Array.isArray(permResponse)) {
            groups = {
              all: permResponse.map((p: any) => ({ id: p.id, name: p.name })),
            };
          }
        }

        // ✅ If no groups found, try to fetch from alternative endpoint
        if (Object.keys(groups).length === 0) {
          console.warn("No permission groups found, trying fallback...");
          // Try to get permissions from the roles/permissions endpoint
          try {
            const fallbackResponse = await RoleService.getRoles({
              per_page: 100,
            });
            if (
              fallbackResponse?.data?.data &&
              fallbackResponse.data.data.length > 0
            ) {
              // Extract unique permissions from roles
              const allPermissions = new Set<string>();
              fallbackResponse.data.data.forEach((role: any) => {
                if (role.permissions && Array.isArray(role.permissions)) {
                  role.permissions.forEach((p: string) =>
                    allPermissions.add(p),
                  );
                }
              });

              if (allPermissions.size > 0) {
                const permArray = Array.from(allPermissions).map(
                  (name, index) => ({
                    id: index + 1,
                    name,
                  }),
                );
                groups = {
                  all: permArray,
                };
              }
            }
          } catch (fallbackError) {
            console.warn("Fallback failed:", fallbackError);
          }
        }

        setPermissionGroups(groups);

        // Load role if editing
        if (roleId) {
          const response = await RoleService.getRole(roleId);
          console.log("Role response:", response);

          if (response?.success && response?.data) {
            const role = response.data as Role;
            reset({ name: role.name });

            const map: Record<string, boolean> = {};
            // ✅ Ensure permissions is an array
            const permissions = Array.isArray(role.permissions)
              ? role.permissions
              : [];
            permissions.forEach((p: string) => (map[p] = true));
            setCheckedPermissions(map);

            setIsProtected(
              role.name === "superadmin" || role.is_protected === true,
            );
          }
        }
      } catch (error: any) {
        console.error("Failed to load data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Failed to load data.",
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [roleId, reset]);

  // ==================== PERMISSION HANDLERS ====================

  const togglePermission = useCallback((key: string) => {
    setCheckedPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleGroupAll = useCallback(
    (perms: PermissionGroup[], checkAll: boolean) => {
      setCheckedPermissions((prev) => {
        const updated = { ...prev };
        perms.forEach((p) => (updated[p.name] = checkAll));
        return updated;
      });
    },
    [],
  );

  const isGroupFullyChecked = useCallback(
    (perms: PermissionGroup[]) => {
      return perms.length > 0 && perms.every((p) => checkedPermissions[p.name]);
    },
    [checkedPermissions],
  );

  // ==================== SUBMIT ====================

  const onSubmit = async (data: RoleFormData) => {
    try {
      setLoading(true);

      const permissionNames = Object.entries(checkedPermissions)
        .filter(([, checked]) => checked)
        .map(([key]) => key);

      let response;
      if (roleId) {
        response = await RoleService.updateRole(roleId, {
          name: isProtected ? undefined : data.name,
          permissions: permissionNames,
        });
      } else {
        response = await RoleService.createRole({
          name: data.name,
          permissions: permissionNames,
        });
      }

      if (response?.success) {
        await Swal.fire({
          icon: "success",
          title: roleId ? "Role Updated!" : "Role Created!",
          text: roleId
            ? "Role has been updated successfully."
            : "Role has been created successfully.",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
        navigate("/roles");
      } else {
        throw new Error(response?.message || "Failed to save role");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      let errorMessage = "Failed to save role. Please try again.";
      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }
      await Swal.fire({
        icon: "error",
        title: "Error!",
        text: errorMessage,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">
          Loading...
        </span>
      </div>
    );
  }

  const hasPermissionGroups = Object.keys(permissionGroups).length > 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {roleId ? "Edit Role" : "Create New Role"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Define the role name and select the permissions it should have.
        </p>
      </div>

      {isProtected && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-400">
          <AlertCircle size={16} />
          Super Admin role name is protected. You can only view its permissions.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Role Name */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Role Name <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Shield size={18} className="text-gray-400" />
            </div>
            <input
              {...register("name")}
              disabled={loading || isProtected}
              placeholder="e.g. cashier, supervisor"
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Lowercase letters, numbers, and underscores only (e.g.
            "store_manager").
          </p>
        </div>

        {/* Permissions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Permissions
          </h3>

          {!hasPermissionGroups ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No permissions available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(permissionGroups).map(([groupName, perms]) => (
                <div key={groupName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {groupName.replace(/_/g, " ")}
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        toggleGroupAll(perms, !isGroupFullyChecked(perms))
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      disabled={loading}
                    >
                      {isGroupFullyChecked(perms) ? "Uncheck all" : "Check all"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checkedPermissions[perm.name] || false}
                          onChange={() => togglePermission(perm.name)}
                          disabled={loading}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {perm.name.replace(/_/g, " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate("/roles")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {roleId ? "Update Role" : "Create Role"}
          </button>
        </div>
      </form>
    </div>
  );
}
