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

export default function SaleList() {
  const today = new Date();
  const formattedToday = `${String(today.getDate()).padStart(2, "0")}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${today.getFullYear()}`;
  const [formData, setFormData] = useState({
    formDate: formattedToday,
    toDate: formattedToday,
    invoiceNo: "",
  });
  const [sales, setSales] = useState([]); // Store fetched data
  const [loading, setLoading] = useState(false);

  const handelDateChange = (field: "formDate" | "toDate", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handelInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handelSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log(formData);
    try {
      const response = await axios.get("http://localhost:8000/api/sale-list", {
        params: {
          formDate: formData.formDate,
          toDate: formData.toDate,
          invoiceNo: formData.invoiceNo,
        },
      });
      setSales(response.data.data);
      // console.log("ok", sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
    setLoading(false);
  };
  useEffect(() => {
    handelSubmit(new Event("submit"));
  }, []);

  const handlePrint = (sale) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");

    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice #${sale.invoiceNo}</title>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; font-size: 12px; border-collapse: collapse; }
          td { padding: 2px 0; }
          .totals td { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="bold">My Company Name</div>
          Address line, City<br/>
          -----------------------------
          <div class="bold">Invoice</div>
        </div>

        <div>
          Invoice: ${sale.invoiceNo}<br/>
          Date: ${sale.entryDate}<br/>
          Payment: ${sale.paymentMode}<br/>
        </div>

        <div class="line"></div>
        <table>
          <thead>
            <tr>
              <td class="bold">Item</td>
              <td class="bold" style="text-align:right;">Qty</td>
              <td class="bold" style="text-align:right;">Price</td>
              <td class="bold" style="text-align:right;">Total</td>
            </tr>
          </thead>
          <tbody>
            ${(sale.products || [])
              .map(
                (p) => `
                <tr>
                  <td>${p.product_name}</td>
                  <td style="text-align:right;">${p.quantity}</td>
                  <td style="text-align:right;">${(
                    p.total / p.quantity
                  ).toFixed(2)}</td>
                  <td style="text-align:right;">${p.total}</td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
        <div class="line"></div>
        <table class="totals">
          <tr>
            <td>Discount</td>
            <td style="text-align:right;">${sale.discount}</td>
          </tr>
          <tr>
            <td>SD</td>
            <td style="text-align:right;">${sale.total_sd}</td>
          </tr>
          <tr>
            <td>VAT</td>
            <td style="text-align:right;">${sale.total_vat}</td>
          </tr>
          <tr>
            <td>Total</td>
            <td style="text-align:right;">${sale.total}</td>
          </tr>
        </table>
        <div class="line"></div>
        <div class="center">
          Thank you for your business!<br/>
          Powered by MySoftware
        </div>
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.print();
  };

  const handelDelete = async (id) => {
    // console.log(id);
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This sale will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    try {
      const response = await axios.delete(
        `http://localhost:8000/api/sale-list/${id}`
      );
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: response.data.message || "Sale has been deleted.",
        timer: 2000,
        showConfirmButton: false,
      });

      setSales((prevSales) => prevSales.filter((s) => s.sale_id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: error.response?.data?.message || "Failed to delete sale.",
      });
    }
  };
  return (
    <>
      <form onSubmit={handelSubmit}>
        <div className="grid grid-cols-4">
          <div className="w-56">
            <DatePicker
              id="formDate"
              label="Form Date"
              name="formDate"
              value={formData.formDate}
              placeholder="Select a date"
              onChange={(dates, currentDateString) => {
                // Handle your logic
                handelDateChange("formDate", currentDateString);
              }}
            />
          </div>
          <div className="w-56">
            <DatePicker
              id="toDate"
              name="toDate"
              value={formData.toDate}
              label="To Date"
              placeholder="Select a date"
              onChange={(dates, currentDateString) => {
                // Handle your logic
                handelDateChange("toDate", currentDateString);
              }}
            />
          </div>
          <div>
            <Label htmlFor="input">Invoice No</Label>
            <Input
              name="invoiceNo"
              type="text"
              id="input"
              value={formData.invoiceNo}
              onChange={handelInputChange}
            />
          </div>
          <div className="flex space-x-3 mt-7 align-middle justify-center">
            <button
              className=" h-10 w-15 bg-green-500 text-white px-1 py-1 rounded hover:bg-green-600"
              type="submit"
            >
              {loading ? "Loading..." : "Search"}
            </button>
            <button
              onClick={() =>
                setFormData({ formDate: "", toDate: "", invoiceNo: "" })
              }
              className="h-10 w-15 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              type="reset"
            >
              Reset
            </button>
          </div>
        </div>
      </form>
      <div className="mt-5">
        <PageBreadcrumb pageTitle="Sale List" />
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
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
                  Vat
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
                  Payment Mode
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {sales.map((sale) => (
                <TableRow key={sale.sale_id}>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {sale.entryDate}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {sale.invoiceNo}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                    {sale.discount}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {sale.sd}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {sale.vat}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {sale.total}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {sale.paymentMode}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400 space-x-1">
                    <button
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      onClick={() => handlePrint(sale)}
                    >
                      Print
                    </button>
                    <button
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      onClick={() => handelDelete(sale.sale_id)}
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
