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
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  Loader2,
  Package,
} from "lucide-react";
import Swal from "sweetalert2";

type UnitType = {
  id: number;
  unit_name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export default function UnitList() {
  const [units, setUnits] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUnits, setFilteredUnits] = useState<UnitType[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUnits();
  }, []);

  // Filter units when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUnits(units);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = units.filter(
        (unit) =>
          unit.unit_name.toLowerCase().includes(term) ||
          unit.id.toString().includes(term),
      );
      setFilteredUnits(filtered);
    }
  }, [searchTerm, units]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/unit");
      console.log("Units response:", res.data);

      // Handle different response structures
      let unitsData = res.data;
      if (res.data.data) {
        unitsData = res.data.data;
      }

      setUnits(unitsData);
      setFilteredUnits(unitsData);
    } catch (error) {
      console.error("Error fetching units:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to load units.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/unit-edit/${id}`);
  };

  const handleView = (id: number) => {
    navigate(`/unit/${id}`);
  };

  const handleDelete = async (id: number, unitName: string) => {
    const result = await Swal.fire({
      title: "Delete Unit?",
      text: `Are you sure you want to delete "${unitName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:8000/api/unit/${id}`);

      setUnits((prev) => prev.filter((u) => u.id !== id));
      setFilteredUnits((prev) => prev.filter((u) => u.id !== id));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Unit deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Error deleting unit:", error);
      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: error.response?.data?.message || "Failed to delete unit.",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const getStatusBadge = (status: string | number) => {
    const statusValue = status?.toString() || "1";
    if (statusValue === "1") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
  };

  const handleRefresh = () => {
    fetchUnits();
    setSearchTerm("");
  };

  return (
    <>
      <PageMeta title="Unit List | A&T" description="Unit List Page" />
      <PageBreadcrumb pageTitle="Unit List" />

      <div className="space-y-6">
        <ComponentCard title="Unit Management">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <button
                onClick={() => navigate("/unit")}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus size={16} />
                Add New
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                {/* Table Header */}
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      SL
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Unit Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Created At
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          <span className="text-gray-500">
                            Loading units...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUnits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-12 h-12 text-gray-300" />
                          <p className="text-gray-500">
                            {searchTerm
                              ? "No units match your search"
                              : "No units found"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Clear search
                            </button>
                          )}
                          {!searchTerm && (
                            <button
                              onClick={() => navigate("/unit")}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Plus size={14} />
                              Add your first unit
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnits.map((unit, index) => (
                      <TableRow
                        key={unit.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="px-4 py-3 text-center text-gray-500">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-medium text-gray-800">
                            {unit.unit_name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {getStatusBadge(unit.status)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-sm text-gray-500">
                          {unit.created_at
                            ? new Date(unit.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => handleView(unit.id)}
                              title="View Unit"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => handleEdit(unit.id)}
                              title="Edit Unit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={() =>
                                handleDelete(unit.id, unit.unit_name)
                              }
                              title="Delete Unit"
                            >
                              <Trash2 size={18} />
                            </button>
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
          {filteredUnits.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500 mt-4">
              <span>
                Showing {filteredUnits.length} of {units.length} units
              </span>
              <div className="flex flex-wrap gap-4">
                <span>
                  Active:{" "}
                  <strong className="text-green-600">
                    {units.filter((u) => u.status?.toString() === "1").length}
                  </strong>
                </span>
                <span>
                  Inactive:{" "}
                  <strong className="text-red-600">
                    {units.filter((u) => u.status?.toString() === "2").length}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
