// src/components/users/UserForm.tsx
import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Lock,
  UserCheck,
  Building,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import AuthService, { STATUS_LABELS, Status } from "../../services/authService";
import RoleService, { RoleData } from "../../services/roleService";
import OutletService from "../../services/OutletService";

// ==================== SCHEMA ====================

const userSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["active", "inactive", "banned"] as const),
  outlet_id: z.number().nullable().optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  userId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UserForm({
  userId,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [outlets, setOutlets] = useState<
    Array<{ value: number; label: string }>
  >([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<
    Record<string, { id: number; name: string }[]>
  >({});
  const [checkedPermissions, setCheckedPermissions] = useState<
    Record<string, boolean>
  >({});

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      role: "",
      status: "active",
      outlet_id: null,
      password: "",
    },
  });

  const selectedRole = watch("role");

  // ==================== LOAD DATA ====================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);

        // Load outlets with proper error handling
        try {
          const outletResponse = await OutletService.getAll();
          console.log('Outlet response:', outletResponse);

          // Extract the array from the response
          let outletArray = [];
          if (outletResponse && typeof outletResponse === 'object') {
            if (Array.isArray(outletResponse)) {
              outletArray = outletResponse;
            } else if (outletResponse.data && Array.isArray(outletResponse.data)) {
              outletArray = outletResponse.data;
            } else if (outletResponse.data?.data && Array.isArray(outletResponse.data.data)) {
              outletArray = outletResponse.data.data;
            } else if (outletResponse.items && Array.isArray(outletResponse.items)) {
              outletArray = outletResponse.items;
            } else if (outletResponse.results && Array.isArray(outletResponse.results)) {
              outletArray = outletResponse.results;
            }
          }

          console.log('Outlet array:', outletArray);

          setOutlets(
            outletArray.map((outlet: any) => ({
              value: outlet.id,
              label: `${outlet.outlet_code || ''} - ${outlet.outlet_name || 'Unnamed'}`,
            }))
          );
        } catch (error) {
          console.error('Failed to load outlets:', error);
          setOutlets([]);
        }

        // Load roles
        try {
          const roleResponse = await RoleService.getRoles({ per_page: 100 });
          console.log('Role response:', roleResponse);

          let roleList: RoleData[] = [];

          // Extract roles from response
          if (roleResponse?.data?.data) {
            roleList = roleResponse.data.data;
          } else if (roleResponse?.data) {
            roleList = Array.isArray(roleResponse.data) ? roleResponse.data : [];
          } else if (Array.isArray(roleResponse)) {
            roleList = roleResponse;
          }

          // ✅ Ensure each role has a permissions array
          roleList = roleList.map(role => ({
            ...role,
            permissions: role.permissions || []
          }));

          console.log('Roles with permissions:', roleList);
          setRoles(roleList);
        } catch (error) {
          console.error('Failed to load roles:', error);
          setRoles([]);
        }

        // Load permissions
        try {
          const permResponse = await RoleService.getPermissionsList();
          console.log('Permission response:', permResponse);

          let permGroups = {};
          if (permResponse?.data) {
            permGroups = permResponse.data;
          } else if (Array.isArray(permResponse)) {
            // If permissions come as array, group them
            permGroups = { all: permResponse };
          }
          setPermissionGroups(permGroups);
        } catch (error) {
          console.error('Failed to load permissions:', error);
          setPermissionGroups({});
        }

        // Editing existing user
        if (userId) {
          try {
            const response = await AuthService.getUser(userId);
            console.log('User API Response:', response);

            if (response.success && response.data) {
              const u = response.data;
              console.log('User data extracted:', u);

              // ✅ permissions from backend = array of names -> convert to checkbox map
              const permMap: Record<string, boolean> = {};
              if (u.permissions && Array.isArray(u.permissions)) {
                u.permissions.forEach((p: string) => (permMap[p] = true));
              }
              setCheckedPermissions(permMap);

              // ✅ Set form values
              reset({
                username: u.username || '',
                email: u.email || '',
                first_name: u.first_name || '',
                last_name: u.last_name || '',
                role: u.role || '',
                status: (u.status as Status) || 'active',
                outlet_id: u.outlet_id || null,
                password: '',
              });

              console.log('Form reset with data:', {
                username: u.username,
                email: u.email,
                first_name: u.first_name,
                last_name: u.last_name,
                role: u.role,
                status: u.status,
                outlet_id: u.outlet_id
              });
            } else {
              throw new Error('User data not found in response');
            }
          } catch (error) {
            console.error('Failed to fetch user:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to load user data. Please try again.',
            });
          }
        } else if (roles.length > 0) {
          // ✅ default: preload first role's permissions for new user
          const defaultRole = roles.find((r) => r.name === "user") || roles[0];
          setValue('role', defaultRole.name);

          const map: Record<string, boolean> = {};
          if (defaultRole.permissions && Array.isArray(defaultRole.permissions)) {
            defaultRole.permissions.forEach((p) => (map[p] = true));
          }
          setCheckedPermissions(map);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load data. Please try again.",
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [userId, reset, setValue]);

  // ==================== RESET TO ROLE DEFAULTS ====================

  const applyRoleDefaults = useCallback(() => {
    const role = roles.find((r) => r.name === selectedRole);
    if (!role) {
      console.warn('Role not found:', selectedRole);
      return;
    }

    // ✅ Check if permissions exist and is an array
    const permissions = role.permissions || [];
    const map: Record<string, boolean> = {};
    permissions.forEach((p) => (map[p] = true));
    setCheckedPermissions(map);
  }, [roles, selectedRole]);

  const togglePermission = (key: string) => {
    setCheckedPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ==================== SUBMIT ====================

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);

      const permissionNames = Object.entries(checkedPermissions)
        .filter(([, checked]) => checked)
        .map(([key]) => key);

      // ✅ Separate role from other data
      const { role, ...restData } = data;

      // ✅ Always include email field, even if empty (send null)
      const submitData = {
        username: restData.username,
        email: restData.email || null, // ✅ Always send email (null if empty)
        first_name: restData.first_name,
        last_name: restData.last_name,
        status: restData.status,
        outlet_id: restData.outlet_id || null,
        password: restData.password || undefined,
      };

      console.log('Submit data:', submitData);

      if (userId) {
        // ✅ Update basic info first
        console.log('Updating user basic info:', submitData);
        await AuthService.updateUser(userId, submitData);

        // ✅ Update role separately using dedicated endpoint
        if (role) {
          console.log('Updating role to:', role);
          try {
            await AuthService.updateUserRole(userId, role);
            console.log('Role updated successfully');
          } catch (roleError: any) {
            console.error('Role update error:', roleError);
            if (roleError.message?.includes('Cannot change your own role')) {
              Swal.fire({
                icon: 'warning',
                title: 'Cannot Change Own Role',
                text: 'You cannot change your own role. Please use a different admin account.',
              });
              setLoading(false);
              return;
            }
            throw roleError;
          }
        }

        // ✅ Update permissions
        if (permissionNames.length > 0) {
          console.log('Updating permissions:', permissionNames);
          await AuthService.updateUserPermissions(userId, permissionNames);
        }

        // ✅ Refresh user data to get updated role
        const updatedUser = await AuthService.getUser(userId);
        console.log('User after all updates:', updatedUser.data);
        console.log('Updated role:', updatedUser.data?.role);

        await Swal.fire({
          icon: "success",
          title: "User Updated!",
          text: "User has been updated successfully.",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
        onSuccess?.();
      } else {
        // ✅ Create user with role
        const createData = {
          username: submitData.username,
          email: submitData.email, // Always included (null if empty)
          password: submitData.password,
          first_name: submitData.first_name,
          last_name: submitData.last_name,
          role: role,
          status: submitData.status,
          outlet_id: submitData.outlet_id,
          permissions: permissionNames,
        };

        console.log('Creating user with data:', createData);

        const response = await AuthService.createUser(createData as any);

        if (response.success) {
          await Swal.fire({
            icon: "success",
            title: "User Created!",
            text: "User has been created successfully.",
            timer: 2000,
            showConfirmButton: false,
            position: "top-end",
            toast: true,
          });
          onSuccess?.();
        }
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      let errorMessage = "Failed to save user. Please try again.";

      if (error.errors) {
        errorMessage = Object.values(error.errors).flat().join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }

      // ✅ Check for specific errors
      if (errorMessage.includes('Cannot change your own role')) {
        errorMessage = 'You cannot change your own role. Please use a different admin account.';
      } else if (errorMessage.includes('outlet_id')) {
        errorMessage = 'Outlet selection is not available. Please try again without selecting an outlet.';
      } else if (errorMessage.includes('email')) {
        errorMessage = 'Please provide a valid email address or leave it empty.';
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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ==================== BASIC INFO ==================== */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCheck size={18} className="text-gray-400" />
              </div>
              <input
                {...register("first_name")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.first_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="First name"
                disabled={loading}
              />
            </div>
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.first_name.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCheck size={18} className="text-gray-400" />
              </div>
              <input
                {...register("last_name")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.last_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Last name"
                disabled={loading}
              />
            </div>
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-500">
                {errors.last_name.message}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                {...register("username")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.username ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Username"
                disabled={loading}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                {...register("email")}
                type="email"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {userId ? "New Password" : "Password"}{" "}
              {!userId && <span className="text-red-500">*</span>}
              {userId && (
                <span className="text-gray-400 text-xs">
                  {" "}
                  (Leave blank to keep current)
                </span>
              )}
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                {...register("password")}
                type="password"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder={
                  userId ? "Leave blank to keep current" : "Enter password"
                }
                disabled={loading}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Role — dynamic dropdown from DB */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Shield size={18} className="text-gray-400" />
              </div>
              <select
                {...register("role")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.role ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
                onChange={(e) => {
                  register("role").onChange(e);
                  applyRoleDefaults();
                }}
              >
                <option value="">Select role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <AlertCircle size={18} className="text-gray-400" />
              </div>
              <select
                {...register("status")}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.status ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.status && (
              <p className="mt-1 text-sm text-red-500">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>

        {/* Outlet Selection */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assigned Outlet{" "}
            <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Building size={18} className="text-gray-400" />
            </div>
            <Controller
              name="outlet_id"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={outlets}
                  isClearable
                  placeholder="Select outlet..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={outlets.find((o) => o.value === field.value) || null}
                  onChange={(option) => field.onChange(option?.value || null)}
                  isDisabled={loading || outlets.length === 0}
                  styles={{
                    control: (base) => ({
                      ...base,
                      paddingLeft: "2rem",
                      borderRadius: "0.5rem",
                      borderColor: "#d1d5db",
                      backgroundColor: "#ffffff",
                      "&:hover": { borderColor: "#9ca3af" },
                    }),
                  }}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* ==================== PERMISSIONS (dynamic groups) ==================== */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Permissions
          </h3>
          <button
            type="button"
            onClick={applyRoleDefaults}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            disabled={loading || !selectedRole}
          >
            Reset to role defaults
          </button>
        </div>

        {Object.keys(permissionGroups).length === 0 ? (
          <p className="text-gray-500 text-sm">No permissions available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(permissionGroups).map(([groupName, perms]) => (
              <div key={groupName} className="space-y-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {groupName}
                </h4>
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
                        {perm.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== ACTIONS ==================== */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
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
          {userId ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
}
