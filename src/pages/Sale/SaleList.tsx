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
import Badge from "../../components/ui/badge/Badge";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

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
    } catch (error) {
      console.error("Error fetching sales:", error);
    }
    setLoading(false);
  };
  useEffect(() => {
    handelSubmit(new Event("submit"));
  }, []);
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
                <TableRow key={sale.id}>
                  {/* <TableCell className="px-5 py-4 sm:px-6 text-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 overflow-hidden rounded-full">
                        <img
                          width={40}
                          height={40}
                          src={order.user.image}
                          alt={order.user.name}
                        />
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {order.user.name}
                        </span>
                        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                          {order.user.role}
                        </span>
                      </div>
                    </div>
                  </TableCell> */}
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
                    <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                      Print
                    </button>
                    <button className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
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
