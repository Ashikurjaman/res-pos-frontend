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
type ProductType = {
  id: number;
  unit_name: string;
  status: string;
};

export default function UnitList() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handleEdit = (id: number) => {
    navigate(`/unit-edit/${id}`);
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/unit/${id}`);

      // Remove the deleted product from the local state
      setProducts((prevProducts) => prevProducts.filter((p) => p.id !== id));

      alert("Category deleted successfully!");
    } catch (err) {
      console.error("Error deleting unit:", err);
      alert("Failed to delete Category!");
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/unit");
        // console.log(res.data.data);
        setProducts(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching unit:", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <PageMeta
        title="Category List | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Unit List" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                {/* Table Header */}
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>SL</TableCell>
                    <TableCell isHeader>Unit Name</TableCell>
                    <TableCell isHeader>Status</TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {product.unit_name}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {product.status}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center space-x-1">
                          <button
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            onClick={() => handleEdit(product.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
