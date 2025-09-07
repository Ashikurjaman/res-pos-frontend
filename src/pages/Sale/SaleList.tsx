import DatePicker from "../../components/form/date-picker";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useState } from "react";
import axios from "axios";

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
    const [sales, setSales] = useState([]); // Store fetched data
    const [loading, setLoading] = useState(false);
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handelSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get("http://localhost:8000/api/sale-list");
      setSales(response.data.data);
    } catch (error) {
      console.error("Error fetching sales:", error);
      setError("Failed to fetch sales. Please try again.");
    }
  };
  return (
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
            defaultDate=""
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
            Search
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
  );
}
