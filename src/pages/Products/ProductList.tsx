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
  product_name: string;
  category_id: string;
  product_type: string;
  price: string;
  product_code: string;
  unit: string;
  vat: string;
  sd: string;
};

export default function ProductList() {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const handleEdit = (id: number) => {
    navigate(`/products-edit/${id}`);
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/api/products/${id}`);

      // Remove the deleted product from the local state
      setProducts((prevProducts) => prevProducts.filter((p) => p.id !== id));

      alert("Product deleted successfully!");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product!");
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/api/products");
        // console.log(res.data.data);
        setProducts(res.data.products.data);
        setCategories(res.data.categories);
        setUnits(res.data.units);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <>
      <PageMeta
        title="Product List | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Product List" />
      <div className="space-y-6">
        <ComponentCard title="Basic Table 1">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                {/* Table Header */}
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Product Name</TableCell>
                    <TableCell isHeader>Category</TableCell>
                    <TableCell isHeader>Product Type</TableCell>
                    <TableCell isHeader>SD</TableCell>
                    <TableCell isHeader>Vat</TableCell>
                    <TableCell isHeader>Unit</TableCell>
                    <TableCell isHeader>Price</TableCell>
                    <TableCell isHeader>Actions</TableCell>
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
                    products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-center">
                          {product.product_name}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {categories.find(
                            (c) => c.id.toString() === product.category_id
                          )?.category_name || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {product.product_type}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {product.sd}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {product.vat}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {units.find((u) => u.id === product.unit)
                            ?.unit_name || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          {product.price}
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
