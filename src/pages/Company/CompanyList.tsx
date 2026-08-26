// src/pages/Company/CompanyList.tsx
import { useEffect, useState, useCallback } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import CompanyService from "../../services/CompanyService";
import { Company } from "../../services/CompanyService";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../hooks/useAuth";
import Swal from "sweetalert2";
import { useNavigate } from "react-router";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Loader2,
  Building,
} from "lucide-react";

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const { hasRole } = useAuth();

  const navigate = useNavigate();

  const { loading, execute } = useApi({
    onSuccess: (data) => {
      setCompanies(data);
      setFilteredCompanies(data);
    },
    onError: (error) => {
      console.error("Failed to load companies:", error);
    },
  });

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    await execute(
      () => CompanyService.getAll(),
      "Companies loaded successfully",
    );
  }, [execute]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Filter companies
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = companies.filter(
        (company) =>
          company.company_name.toLowerCase().includes(term) ||
          company.outlet_name.toLowerCase().includes(term) ||
          company.address.toLowerCase().includes(term) ||
          company.contact_no.includes(term) ||
          (company.email && company.email.toLowerCase().includes(term)),
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  const handleDelete = useCallback(
    async (company: Company) => {
      const result = await Swal.fire({
        title: "Delete Company?",
        text: `Are you sure you want to delete "${company.company_name}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      try {
        await CompanyService.delete(company.id);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
        fetchCompanies();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed!",
          text: error.response?.data?.message || "Failed to delete company.",
          confirmButtonColor: "#3b82f6",
        });
      }
    },
    [fetchCompanies],
  );

  const handleRestore = useCallback(
    async (company: Company) => {
      const result = await Swal.fire({
        title: "Restore Company?",
        text: `Are you sure you want to restore "${company.company_name}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3b82f6",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, restore",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      try {
        await CompanyService.restore(company.id);
        Swal.fire({
          icon: "success",
          title: "Restored!",
          timer: 2000,
          showConfirmButton: false,
          position: "top-end",
          toast: true,
        });
        fetchCompanies();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Restore Failed!",
          text: error.response?.data?.message || "Failed to restore company.",
          confirmButtonColor: "#3b82f6",
        });
      }
    },
    [fetchCompanies],
  );

  const getValidityBadge = (validity: boolean) => {
    return validity
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  };

  const getPayTypeBadge = (payType: number) => {
    return payType === 1
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      <PageMeta title="Company List | A&T" description="Company Management" />
      <PageBreadcrumb pageTitle="Company List" />

      <div className="space-y-6">
        <ComponentCard title="Company Management">
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
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                aria-label="Search companies"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={fetchCompanies}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                aria-label="Refresh"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                  aria-hidden="true"
                />
                Refresh
              </button>
              <button
                onClick={() => navigate("/companies/create")}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus size={16} aria-hidden="true" />
                Add New
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Outlet
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pay Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2
                            className="w-5 h-5 animate-spin text-blue-500"
                            aria-hidden="true"
                          />
                          <span className="text-gray-500 dark:text-gray-400">
                            Loading companies...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Building
                            className="w-12 h-12 text-gray-300 dark:text-gray-600"
                            aria-hidden="true"
                          />
                          <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm
                              ? "No companies match your search"
                              : "No companies found"}
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
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company, index) => (
                      <tr
                        key={company.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {company.company_name}
                            </div>
                            {company.slogan && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {company.slogan}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {company.outlet_name}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {company.contact_no}
                            </div>
                            {company.email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {company.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPayTypeBadge(company.pay_type)}`}
                          >
                            {company.pay_type === 1 ? "Paid" : "Due"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getValidityBadge(company.validity)}`}
                          >
                            {company.validity ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                navigate(`/companies/${company.id}`)
                              }
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="View"
                              aria-label={`View ${company.company_name}`}
                            >
                              <Eye size={18} aria-hidden="true" />
                            </button>
                            <button
                              onClick={() =>
                                navigate(`/companies/edit/${company.id}`)
                              }
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit"
                              aria-label={`Edit ${company.company_name}`}
                            >
                              <Edit size={18} aria-hidden="true" />
                            </button>
                            {!company.validity ? (
                              <button
                                onClick={() => handleRestore(company)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                title="Restore"
                                aria-label={`Restore ${company.company_name}`}
                              >
                                <RefreshCw size={18} aria-hidden="true" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelete(company)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete"
                                aria-label={`Delete ${company.company_name}`}
                              >
                                <Trash2 size={18} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          {filteredCompanies.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4">
              <span>
                Showing {filteredCompanies.length} of {companies.length}{" "}
                companies
              </span>
              <div className="flex flex-wrap gap-4">
                <span>
                  Active:{" "}
                  <strong className="text-green-600 dark:text-green-400">
                    {companies.filter((c) => c.validity).length}
                  </strong>
                </span>
                <span>
                  Inactive:{" "}
                  <strong className="text-red-600 dark:text-red-400">
                    {companies.filter((c) => !c.validity).length}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}
