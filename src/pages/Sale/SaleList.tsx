import DatePicker from "../../components/form/date-picker";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Swal from "sweetalert2";
import { Search, RotateCcw, Printer, Trash2, Eye, Loader2, Edit2, Check, X } from "lucide-react";

interface Sale {
  sale_id: number;
  invoiceNo: string;
  entryDate: string;
  discount: number;
  sd: number;
  vat: number;
  total: number;
  paymentMode: string;
  table_name?: string;
  table_number?: string;
  status?: string;
  products?: any[];
}

export default function SaleList() {
  const today = new Date();
  const formattedToday = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${today.getFullYear()}`;

  const [formData, setFormData] = useState({
    formDate: formattedToday,
    toDate: formattedToday,
    invoiceNo: "",
  });
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editingPaymentValue, setEditingPaymentValue] = useState<string>("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const handleDateChange = (field: "formDate" | "toDate", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.get("http://localhost:8000/api/sale-list", {
        params: {
          formDate: formData.formDate,
          toDate: formData.toDate,
          invoiceNo: formData.invoiceNo,
        },
      });
      setSales(response.data.data);
      setFilteredSales(response.data.data);
    } catch (error) {
      console.error("Error fetching sales:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to fetch sales data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSubmit(new Event("submit") as any);
  }, []);

  // Filter sales by search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSales(sales);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = sales.filter(
        (sale) =>
          sale.invoiceNo?.toLowerCase().includes(term) ||
          sale.entryDate?.includes(term) ||
          sale.paymentMode?.toLowerCase().includes(term) ||
          sale.table_name?.toLowerCase().includes(term),
      );
      setFilteredSales(filtered);
    }
  }, [searchTerm, sales]);

  const handleReset = () => {
    setFormData({ formDate: "", toDate: "", invoiceNo: "" });
    setSearchTerm("");
    handleSubmit(new Event("submit") as any);
  };

  const handlePrint = (sale: Sale) => {
    // Check if products exist
    if (!sale.products || sale.products.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Products",
        text: "This sale has no products to print.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const printWindow = window.open("", "_blank", "width=400,height=600");

    if (!printWindow) {
      Swal.fire({
        icon: "error",
        title: "Popup Blocked!",
        text: "Please allow popups for this site to print.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const productsHtml = (sale.products || [])
      .map(
        (p) => `
        <tr>
          <td>${p.product_name || "N/A"}</td>
          <td style="text-align:center;">${p.quantity || 0}</td>
          <td style="text-align:right;">${((p.total || 0) / (p.quantity || 1)).toFixed(2)}</td>
          <td style="text-align:right;">${(p.total || 0).toFixed(2)}</td>
        </tr>
      `,
      )
      .join("");

    const printContent = `
    <html>
      <head>
        <title>Invoice #${sale.invoiceNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 13px; 
            padding: 15px; 
            width: 280px;
            margin: 0 auto;
            background: white;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; font-size: 12px; border-collapse: collapse; }
          td { padding: 3px 0; }
          .totals td { font-weight: bold; }
          .header { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
          .footer { border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .status-badge {
            background: ${sale.status === "completed" ? "#d1fae5" : sale.status === "printed" ? "#fef3c7" : "#dbeafe"};
            padding: 2px 8px;
            border-radius: 4px;
            display: inline-block;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
          }
          .info-row .label { font-weight: bold; }
          .thankyou { font-size: 16px; font-weight: bold; margin-top: 6px; }
          .sub { font-size: 10px; color: #666; margin-top: 2px; }
          @media print {
            body { width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="center header">
          <div class="bold" style="font-size:18px;">My Store</div>
          <div style="font-size:11px;">Address Line, City</div>
          <div style="font-size:11px;">Phone: 123-456-7890</div>
        </div>

        <div>
          <div class="info-row">
            <span class="label">Invoice:</span>
            <span>${sale.invoiceNo}</span>
          </div>
          <div class="info-row">
            <span class="label">Date:</span>
            <span>${sale.entryDate}</span>
          </div>
          <div class="info-row">
            <span class="label">Payment:</span>
            <span>${sale.paymentMode}</span>
          </div>
          ${sale.table_name ? `
          <div class="info-row">
            <span class="label">Table:</span>
            <span>${sale.table_name} (${sale.table_number || 'N/A'})</span>
          </div>` : ""}
          ${sale.status ? `
          <div class="info-row">
            <span class="label">Status:</span>
            <span><span class="status-badge">${sale.status.toUpperCase()}</span></span>
          </div>` : ""}
        </div>

        <div class="line"></div>
        <table>
          <thead>
            <tr>
              <td class="bold">Item</td>
              <td class="bold text-center">Qty</td>
              <td class="bold text-right">Price</td>
              <td class="bold text-right">Total</td>
            </tr>
          </thead>
          <tbody>
            ${productsHtml || '<tr><td colspan="4" class="text-center">No products</td></tr>'}
          </tbody>
        </table>
        <div class="line"></div>
        <table class="totals">
          <tr>
            <td>Subtotal</td>
            <td class="text-right">${(sale.total || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Discount</td>
            <td class="text-right">${(sale.discount || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>SD</td>
            <td class="text-right">${(sale.sd || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td>VAT</td>
            <td class="text-right">${(sale.vat || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td class="bold">Total</td>
            <td class="text-right bold">${(sale.total || 0).toFixed(2)}</td>
          </tr>
        </table>
        <div class="line"></div>
        <div class="center footer">
          <div class="thankyou">*** Thank You! ***</div>
          <div class="sub">Powered by MySoftware</div>
        </div>
      </body>
    </html>
  `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Don't close immediately, let user close manually
    }, 300);
  };

  const handleDelete = async (id: number, invoiceNo: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Sale #${invoiceNo} will be deleted permanently!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:8000/api/sale-list/${id}`);

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Sale has been deleted successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      setSales((prevSales) => prevSales.filter((s) => s.sale_id !== id));
      setFilteredSales((prev) => prev.filter((s) => s.sale_id !== id));
    } catch (error: any) {
      console.error("Delete failed:", error);
      Swal.fire({
        icon: "error",
        title: "Delete Failed!",
        text: error.response?.data?.message || "Failed to delete sale.",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  // ✅ Update Payment Mode
  const handleEditPayment = (sale: Sale) => {
    setEditingPaymentId(sale.sale_id);
    setEditingPaymentValue(sale.paymentMode);
  };

  const handleCancelEditPayment = () => {
    setEditingPaymentId(null);
    setEditingPaymentValue("");
  };

  const handleUpdatePayment = async (id: number) => {
    if (!editingPaymentValue) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Payment Mode",
        text: "Please select a payment mode.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    setUpdatingPayment(true);
    try {
      const response = await axios.put(
        `http://localhost:8000/api/sales/${id}/update`,
        {
          paymentMode: editingPaymentValue,
        }
      );

      // Update local state
      setSales((prev) =>
        prev.map((s) =>
          s.sale_id === id ? { ...s, paymentMode: editingPaymentValue } : s
        )
      );
      setFilteredSales((prev) =>
        prev.map((s) =>
          s.sale_id === id ? { ...s, paymentMode: editingPaymentValue } : s
        )
      );

      Swal.fire({
        icon: "success",
        title: "Payment Updated!",
        text: "Payment mode updated successfully.",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });

      setEditingPaymentId(null);
      setEditingPaymentValue("");
    } catch (error: any) {
      console.error("Update payment failed:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed!",
        text: error.response?.data?.message || "Failed to update payment mode.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setUpdatingPayment(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusMap: Record<string, { color: string; label: string }> = {
      active: { color: "bg-blue-100 text-blue-800", label: "Active" },
      printed: { color: "bg-yellow-100 text-yellow-800", label: "Printed" },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
    };

    const info = statusMap[status.toLowerCase()] || {
      color: "bg-gray-100 text-gray-800",
      label: status,
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}
      >
        {info.label}
      </span>
    );
  };

  const paymentOptions = ["Cash", "Card", "Mobile"];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Sale List" />
      </div>

      {/* Filter Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <DatePicker
                id="formDate"
                label="Form Date"
                name="formDate"
                value={formData.formDate}
                placeholder="Select start date"
                onChange={(dates, currentDateString) => {
                  handleDateChange("formDate", currentDateString);
                }}
              />
            </div>

            <div>
              <DatePicker
                id="toDate"
                name="toDate"
                value={formData.toDate}
                label="To Date"
                placeholder="Select end date"
                onChange={(dates, currentDateString) => {
                  handleDateChange("toDate", currentDateString);
                }}
              />
            </div>

            <div>
              <Label htmlFor="invoiceNo">Invoice No</Label>
              <Input
                name="invoiceNo"
                type="text"
                id="invoiceNo"
                value={formData.invoiceNo}
                onChange={handleInputChange}
                placeholder="Enter invoice number"
                className="w-full"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 h-10"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                {loading ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 h-10"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Search */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Total:{" "}
            <span className="font-semibold text-gray-700">
              {filteredSales.length}
            </span>{" "}
            sales
          </span>
          {loading && (
            <span className="text-sm text-blue-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading...
            </span>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search sales..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Date
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Invoice No
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Table
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Discount
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  SD
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  VAT
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Total Amount
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Payment
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading sales...
                      </div>
                    ) : (
                      "No sales found"
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => {
                  const isEditing = editingPaymentId === sale.sale_id;

                  return (
                    <TableRow
                      key={sale.sale_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {sale.entryDate}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 font-medium text-start text-theme-sm dark:text-gray-400">
                        {sale.invoiceNo}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {sale.table_name || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {sale.discount || 0}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {sale.sd || 0}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {sale.vat || 0}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-700 font-semibold text-start text-theme-sm dark:text-gray-400">
                        ৳{sale.total?.toFixed(2) || 0}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm dark:text-gray-400">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editingPaymentValue}
                              onChange={(e) => setEditingPaymentValue(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={updatingPayment}
                            >
                              {paymentOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleUpdatePayment(sale.sale_id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              disabled={updatingPayment}
                              title="Save"
                            >
                              {updatingPayment ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Check size={16} />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEditPayment}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              disabled={updatingPayment}
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{sale.paymentMode}</span>
                            <button
                              onClick={() => handleEditPayment(sale)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Payment"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start text-theme-sm dark:text-gray-400">
                        {getStatusBadge(sale.status)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => handlePrint(sale)}
                            title="Print Invoice"
                          >
                            <Printer size={18} />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDelete(sale.sale_id, sale.invoiceNo)}
                            title="Delete Sale"
                          >
                            <Trash2 size={18} />
                          </button>
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

      {filteredSales.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {filteredSales.length} of {sales.length} sales
        </div>
      )}
    </div>
  );
}