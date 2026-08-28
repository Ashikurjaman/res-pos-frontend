// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

// Auth Pages
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";

// Error Pages
import NotFound from "./pages/OtherPage/NotFound";
import Unauthorized from "./pages/OtherPage/Unauthorized";

// Dashboard
import Home from "./pages/Dashboard/Home";

// Sale Pages
import CreateSale from "./pages/Sale/CreateSale";
import SaleList from "./pages/Sale/SaleList";

// Product Pages
import Product from "./pages/Products/Product";
import ProductList from "./pages/Products/ProductList";
import ProductEdit from "./pages/Products/ProductEdit";
import ProductForm from "./pages/Products/ProductForm";
import StockManagement from "./pages/Products/StockManagement";

// Category Pages
import Category from "./pages/Category/Category";
import CategoryList from "./pages/Category/CategoryList";
import CategoryEdit from "./pages/Category/CategoryEdit";

// Unit Pages
import Unit from "./pages/Unit/Unit";
import UnitList from "./pages/Unit/UnitList";
import UnitEdit from "./pages/Unit/UnitEdit";
import UnitView from "./pages/Unit/UnitView";

// Supplier Pages
import SupplierList from "./pages/Supplier/SupplierList";
import SupplierForm from "./pages/Supplier/SupplierForm";

// Outlet Pages
import OutletList from "./pages/Outlet/OutletList";
import OutletForm from "./pages/Outlet/OutletForm";

// Company Pages
import CompanyList from "./pages/Company/CompanyList";
import CompanyForm from "./pages/Company/CompanyForm";

// Table Pages
import TableManagement from "./pages/Table/TableManagement";

// User Pages
import UserProfiles from "./pages/UserProfiles";

// UI Elements
import Calendar from "./pages/Calendar";
import Blank from "./pages/Blank";
import FormElements from "./pages/Forms/FormElements";
import BasicTables from "./pages/Tables/BasicTables";
import Alerts from "./pages/UiElements/Alerts";
import Avatars from "./pages/UiElements/Avatars";
import Badges from "./pages/UiElements/Badges";
import Buttons from "./pages/UiElements/Buttons";
import Images from "./pages/UiElements/Images";
import Videos from "./pages/UiElements/Videos";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import FoodTypeList from "./pages/FoodType/FoodTypeList";
import FoodTypeForm from "./pages/FoodType/FoodTypeForm";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<Navigate to="/signin" replace />} />

          {/* ==================== PROTECTED ROUTES ==================== */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Home />} />

              {/* Sale Routes */}
              <Route path="/create-sale" element={<CreateSale />} />
              <Route path="/sale-list" element={<SaleList />} />

              {/* Product Routes */}
              <Route path="/products" element={<Product />} />
              <Route path="/products-list" element={<ProductList />} />
              <Route path="/products-edit/:id" element={<ProductEdit />} />
              <Route path="/products/create" element={<ProductForm />} />
              <Route path="/products/edit/:id" element={<ProductForm />} />
              <Route path="/stock-management" element={<StockManagement />} />

              {/* Supplier Routes */}
              <Route path="/suppliers" element={<SupplierList />} />
              <Route path="/suppliers/create" element={<SupplierForm />} />
              <Route path="/suppliers/edit/:id" element={<SupplierForm />} />
              <Route path="/suppliers/:id" element={<SupplierForm />} />

              {/* Category Routes */}
              <Route path="/category" element={<Category />} />
              <Route path="/category-list" element={<CategoryList />} />
              <Route path="/category-edit/:id" element={<CategoryEdit />} />

              {/* Unit Routes */}
              <Route path="/unit" element={<Unit />} />
              <Route path="/unit-list" element={<UnitList />} />
              <Route path="/unit-edit/:id" element={<UnitEdit />} />
              <Route path="/unit-view/:id" element={<UnitView />} />

              {/* Outlet Routes */}
              <Route path="/outlets" element={<OutletList />} />
              <Route path="/outlets/create" element={<OutletForm />} />
              <Route path="/outlets/edit/:id" element={<OutletForm />} />
              <Route path="/outlets/:id" element={<OutletForm />} />


              <Route path="/food-types" element={<FoodTypeList />} />
              <Route path="/food-types/create" element={<FoodTypeForm />} />
              <Route path="/food-types/edit/:id" element={<FoodTypeForm />} />
              <Route path="/food-types/:id" element={<FoodTypeForm />} />

              {/* Company Routes */}
              <Route path="/companies" element={<CompanyList />} />
              <Route path="/companies/create" element={<CompanyForm />} />
              <Route path="/companies/edit/:id" element={<CompanyForm />} />
              <Route path="/companies/:id" element={<CompanyForm />} />

              {/* Table Routes */}
              <Route path="/tables" element={<TableManagement />} />

              {/* Profile */}
              <Route path="/profile" element={<UserProfiles />} />

              {/* UI Elements */}
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/form-elements" element={<FormElements />} />
              <Route path="/basic-tables" element={<BasicTables />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          {/* ==================== 404 NOT FOUND ==================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
