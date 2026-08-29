// src/pages/Supplier/SupplierList.tsx
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
import SupplierService from "../../services/SupplierService";
import { Supplier } from "../../types/supplier";
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Loader2,
  Users,
} from "lucide-react";

export default function SupplierList() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (!Array.isArray(suppliers) || suppliers.length === 0) {
      setFilteredSuppliers([]);
      return;
    }

    if (searchTerm.trim() === "") {
      setFilteredSuppliers(suppliers);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = suppliers.filter(
        (supplier) =>
          supplier.supplier_name?.toLowerCase().includes(term) ||
          supplier.username?.toLowerCase().includes(term) ||
          supplier.contact_no?.includes(term) ||
          (supplier.address && supplier.address.toLowerCase().includes(term))
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchTerm, suppliers]);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching suppliers...");

      const data = await SupplierService.getAll();
      console.log("📥 Suppliers data:", data);

      const supplierArray = Array.isArray(data) ? data : [];
      setSuppliers(supplierArray);
      setFilteredSuppliers(supplierArray);
    } catch (error: any) {
      console.error("❌ Error fetching suppliers:", error);
      if (error.status === 401) {
        navigate("/signin");
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.message || "Failed to load suppliers.",
        confirmButtonColor: "#3b82f6",
      });
      setSuppliers([]);
      setFilteredSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSuppliers();
    }
  }, [isAuthenticated, fetchSuppliers]);

  const handleDelete = useCallback(async (supplier: Supplier) => {
    const result = await Swal.fire({
      title: "Delete Supplier?",
      text: `Are you sure you want to delete "${supplier.supplier_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await SupplierService.delete(supplier.id);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
      fetchSuppliers();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: error.message || "Failed to delete supplier.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [fetchSuppliers]);

  const handleRestore = useCallback(async (supplier: Supplier) => {
    const result = await Swal.fire({
      title: "Restore Supplier?",
      text: `Are you sure you want to restore "${supplier.supplier_name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, restore",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await SupplierService.restore(supplier.id);
      Swal.fire({
        icon: "success",
        title: "Restored!",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
      fetchSuppliers();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Restore Failed!",
        text: error.message || "Failed to restore supplier.",
        confirmButtonColor: "#3b82f6",
      });
    }
  }, [fetchSuppliers]);

  // ✅ Helper function to safely format currency
  const formatCurrency = useCallback((amount: any): string => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
  }, []);

  const stats = useMemo(() => {
    const supplierArray = Array.isArray(suppliers) ? suppliers : [];
    return {
      total: supplierArray.length,
      active: supplierArray.filter((s) => s.validity === 1).length,
      inactive: supplierArray.filter((s) => s.validity === 0).length,
    };
  }, [suppliers]);

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
      <PageMeta title="Supplier List | A&T" description="Supplier Management" />
      <PageBreadcrumb pageTitle="Supplier List" />

      <div className="space-y-6">
        <ComponentCard title="Supplier Management">
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
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                aria-label="Search suppliers"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={fetchSuppliers}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
                Refresh
              </button>
              <button
                onClick={() => navigate("/suppliers/create")}
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
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Suppliers</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Active</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.active}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">Inactive</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.inactive}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700">
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      SL
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Supplier Name
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Username
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Due Balance
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </TableCell>
                    <TableCell isHeader className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" aria-hidden="true" />
                          <span className="text-gray-500 dark:text-gray-400">Loading suppliers...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm ? "No suppliers match your search" : "No suppliers found"}
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
                    filteredSuppliers.map((supplier, index) => {
                      // ✅ Safely get due balance
                      const dueBalance = parseFloat(supplier.due_balance as any) || 0;

                      return (
                        <TableRow key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {supplier.supplier_name}
                              </div>
                              {supplier.address && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {supplier.address}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {supplier.username}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {supplier.contact_no}
                            {supplier.bin_nid && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                BIN: {supplier.bin_nid}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <span className={`font-semibold ${dueBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ৳{formatCurrency(dueBalance)}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              supplier.validity === 1
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                              {supplier.validity === 1 ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                onClick={() => navigate(`/suppliers/${supplier.id}`)}
                                title="View"
                                aria-label={`View ${supplier.supplier_name}`}
                              >
                                <Eye size={18} aria-hidden="true" />
                              </button>
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
                                title="Edit"
                                aria-label={`Edit ${supplier.supplier_name}`}
                              >
                                <Edit size={18} aria-hidden="true" />
                              </button>
                              {supplier.validity === 0 ? (
                                <button
                                  onClick={() => handleRestore(supplier)}
                                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                  title="Restore"
                                  aria-label={`Restore ${supplier.supplier_name}`}
                                >
                                  <RefreshCw size={18} aria-hidden="true" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDelete(supplier)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Delete"
                                  aria-label={`Delete ${supplier.supplier_name}`}
                                >
                                  <Trash2 size={18} aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Footer */}
          {filteredSuppliers.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
              </span>
              <div className="flex flex-wrap gap-4">
                <span>
                  Active: <strong className="text-green-600 dark:text-green-400">{stats.active}</strong>
                </span>
                <span>
                  Inactive: <strong className="text-red-600 dark:text-red-400">{stats.inactive}</strong>
                </span>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
