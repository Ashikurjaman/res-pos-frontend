import { Link } from "react-router";
import { ShoppingCart, Package, TrendingUp, Zap } from "lucide-react";

export default function SidebarWidget() {
  return (
    <div className="mx-auto w-full max-w-60 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      {/* Stats */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Total Sales
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            ৳45,678
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Products
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            156
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Customers
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            89
          </span>
        </div>
      </div>

      {/* Actions */}
      <Link
        to="/sale"
        className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors mb-1.5"
      >
        <Zap size={14} />
        New Sale
      </Link>
      <Link
        to="/products"
        className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Package size={14} />
        Add Product
      </Link>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Business Pro Plan
        </p>
        <Link
          to="#"
          className="mt-1 flex items-center justify-center w-full py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Upgrade
        </Link>
      </div>
    </div>
  );
}
