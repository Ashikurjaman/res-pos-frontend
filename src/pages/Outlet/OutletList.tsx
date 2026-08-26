// src/pages/Outlet/OutletList.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import OutletService from "../../services/OutletService";
import { Outlet } from "../../types/outlet";
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Loader2,
  Store,
} from "lucide-react";

export default function OutletList() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredOutlets, setFilteredOutlets] = useState<Outlet[]>([]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Filter outlets
  useEffect(() => {
    // ✅ Ensure outlets is an array before filtering
    if (!Array.isArray(outlets)) {
      setFilteredOutlets([]);
      return;
    }

    if (searchTerm.trim() === "") {
      setFilteredOutlets(outlets);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = outlets.filter(
        (outlet) =>
          outlet.outlet_name?.toLowerCase().includes(term) ||
          outlet.outlet_code?.toLowerCase().includes(term) ||
          outlet.outlet_address?.toLowerCase().includes(term) ||
          outlet.outlet_mgr?.toLowerCase().includes(term) ||
          (outlet.short_name && outlet.short_name.toLowerCase().includes(term)),
      );
      setFilteredOutlets(filtered);
    }
  }, [searchTerm, outlets]);

  const fetchOutlets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await OutletService.getAll();

      // ✅ Handle different response formats
      let outletsData: Outlet[] = [];

      if (Array.isArray(response)) {
        outletsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        outletsData = response.data;
      } else if (
        response &&
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        outletsData = response.data.data;
      } else if (
        response &&
        response.outlets &&
        Array.isArray(response.outlets)
      ) {
        outletsData = response.outlets;
      } else {
        // Try to extract any array from the response
        console.warn("Unexpected response format:", response);
        const values = Object.values(response || {});
        const arrayValue = values.find((v) => Array.isArray(v));
        if (arrayValue) {
          outletsData = arrayValue;
        }
      }

      console.log("✅ Outlets data:", outletsData);
      setOutlets(outletsData);
      setFilteredOutlets(outletsData);
    } catch (error: any) {
      console.error("Error fetching outlets:", error);

      if (error.status === 401) {
        navigate("/signin");
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load outlets.",
        confirmButtonColor: "#3b82f6",
      });
      // ✅ Set empty array on error
      setOutlets([]);
      setFilteredOutlets([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOutlets();
    }
  }, [isAuthenticated, fetchOutlets]);

  const handleDelete = useCallback(
    async (outlet: Outlet) => {
      const result = await Swal.fire({
        title: "Delete Outlet?",
        text: `Are you sure you want to delete "${outlet.outlet_name}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      try {
        await OutletService.delete(outlet.id);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
        fetchOutlets();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed!",
          text: error.message || "Failed to delete outlet.",
          confirmButtonColor: "#3b82f6",
        });
      }
    },
    [fetchOutlets],
  );

  const handleRestore = useCallback(
    async (outlet: Outlet) => {
      const result = await Swal.fire({
        title: "Restore Outlet?",
        text: `Are you sure you want to restore "${outlet.outlet_name}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3b82f6",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, restore",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      try {
        await OutletService.restore(outlet.id);
        Swal.fire({
          icon: "success",
          title: "Restored!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
        fetchOutlets();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Restore Failed!",
          text: error.message || "Failed to restore outlet.",
          confirmButtonColor: "#3b82f6",
        });
      }
    },
    [fetchOutlets],
  );

  const getStatusBadge = useCallback((status: number, validity: number) => {
    if (status === 1 && validity === 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Active
        </span>
      );
    } else if (status === 0 && validity === 0) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Deleted
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Inactive
        </span>
      );
    }
  }, []);

  // ✅ Stats with proper array check
  const stats = useMemo(() => {
    // Ensure outlets is an array
    const outletArray = Array.isArray(outlets) ? outlets : [];

    return {
      total: outletArray.length,
      active: outletArray.filter((o) => o.status === 1 && o.validity === 1)
        .length,
      inactive: outletArray.filter((o) => o.status === 0 || o.validity === 0)
        .length,
    };
  }, [outlets]);

  // Show loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <PageMeta title="Outlet List | A&T" description="Outlet Management" />
      <PageBreadcrumb pageTitle="Outlet List" />

      <div className="space-y-6">
        <ComponentCard title="Outlet Management">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search outlets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                aria-label="Search outlets"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={fetchOutlets}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                Refresh
              </button>
              <button
                onClick={() => navigate("/outlets/create")}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} aria-hidden="true" />
                Add New
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Total Outlets
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.total}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Active
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.active}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">Inactive</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stats.inactive}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      SL
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Code
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Outlet Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Manager
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Contact
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2
                            className="w-5 h-5 animate-spin text-blue-500"
                            aria-hidden="true"
                          />
                          <span className="text-gray-500 dark:text-gray-400">
                            Loading outlets...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : !Array.isArray(filteredOutlets) ||
                    filteredOutlets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Store
                            className="w-12 h-12 text-gray-300 dark:text-gray-600"
                            aria-hidden="true"
                          />
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm
                              ? "No outlets match your search"
                              : "No outlets found"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")}
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOutlets.map((outlet, index) => (
                      <TableRow
                        key={outlet.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {outlet.outlet_code}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {outlet.outlet_name}
                            </div>
                            {outlet.short_name && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {outlet.short_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {outlet.outlet_mgr}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {outlet.mgr_contact_no}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              HO: {outlet.ho_mobile_no}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {getStatusBadge(outlet.status, outlet.validity)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              onClick={() => navigate(`/outlets/${outlet.id}`)}
                              title="View"
                              aria-label={`View ${outlet.outlet_name}`}
                            >
                              <Eye size={18} aria-hidden="true" />
                            </button>
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              onClick={() =>
                                navigate(`/outlets/edit/${outlet.id}`)
                              }
                              title="Edit"
                              aria-label={`Edit ${outlet.outlet_name}`}
                            >
                              <Edit size={18} aria-hidden="true" />
                            </button>
                            {outlet.status === 0 || outlet.validity === 0 ? (
                              <button
                                onClick={() => handleRestore(outlet)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                title="Restore"
                                aria-label={`Restore ${outlet.outlet_name}`}
                              >
                                <RefreshCw size={18} aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelete(outlet)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete"
                                aria-label={`Delete ${outlet.outlet_name}`}
                              >
                                <Trash2 size={18} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer */}
          {Array.isArray(filteredOutlets) && filteredOutlets.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>
                Showing {filteredOutlets.length} of{" "}
                {Array.isArray(outlets) ? outlets.length : 0} outlets
              </span>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
