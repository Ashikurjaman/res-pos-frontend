// src/pages/Unit/UnitView.tsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { API_CONFIG } from "../../config/api";
import axios from "axios";
import Swal from "sweetalert2";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Loader2, ArrowLeft } from "lucide-react";

type UnitType = {
  id: number;
  unit_name: string;
  status: string | number;
  created_at?: string;
  updated_at?: string;
};

export default function UnitView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [unit, setUnit] = useState<UnitType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  }, []);

  const fetchUnit = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await axios.get(
        `${API_CONFIG.baseURL}/unit/${id}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      let unitData = response.data;
      if (response.data.data) {
        unitData = response.data.data;
      }

      setUnit(unitData);
    } catch (error: any) {
      console.error("Error fetching unit:", error);

      if (error.response?.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Session Expired",
          text: "Your session has expired. Please login again.",
          confirmButtonColor: "#3b82f6",
        }).then(() => {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          navigate("/signin");
        });
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response?.data?.message || "Failed to load unit details.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  }, [id, getAuthToken, navigate]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchUnit();
    }
  }, [isAuthenticated, id, fetchUnit]);

  const handleBack = () => {
    navigate("/unit-list");
  };

  const getStatusBadge = (status: string | number) => {
    const statusValue = status?.toString() || "1";
    if (statusValue === "1") {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Active
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Inactive
        </span>
      );
    }
  };

  // Show loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
        <PageBreadcrumb pageTitle="Unit Details" />
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center max-w-md">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
              Unit Not Found
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              The unit you're looking for doesn't exist.
            </p>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Unit List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <PageMeta title="Unit Details | A&T" description="Unit Details Page" />
      <PageBreadcrumb pageTitle="Unit Details" />

      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl">
          <ComponentCard title="Unit Details">
            <div className="space-y-6">
              {/* Unit Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Unit Name
                </label>
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white">
                  {unit.unit_name}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Status
                </label>
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {getStatusBadge(unit.status)}
                </div>
              </div>

              {/* Created At */}
              {unit.created_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Created At
                  </label>
                  <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white">
                    {new Date(unit.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}

              {/* Updated At */}
              {unit.updated_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                    Updated At
                  </label>
                  <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white">
                    {new Date(unit.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Back to List
                </button>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
