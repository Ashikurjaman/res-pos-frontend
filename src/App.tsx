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

// Pages
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import Home from "./pages/Dashboard/Home";
import CreateSale from "./pages/Sale/CreateSale";
import SaleList from "./pages/Sale/SaleList";
import Product from "./pages/Products/Product";
import ProductList from "./pages/Products/ProductList";
import ProductEdit from "./pages/Products/ProductEdit";
import StockManagement from "./pages/Products/StockManagement";
import Category from "./pages/Category/Category";
import CategoryList from "./pages/Category/CategoryList";
import CategoryEdit from "./pages/Category/CategoryEdit";
import Unit from "./pages/Unit/Unit";
import UnitList from "./pages/Unit/UnitList";
import UnitEdit from "./pages/Unit/UnitEdit";
import TableManagement from "./pages/Table/TableManagement";
import CompanyList from "./pages/Company/CompanyList";
import CompanyForm from "./pages/Company/CompanyForm";
import UserProfiles from "./pages/UserProfiles";
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
import OutletList from "./pages/Outlet/OutletList";
import OutletForm from "./pages/Outlet/OutletForm";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<Navigate to="/signin" replace />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/create-sale" element={<CreateSale />} />
              <Route path="/sale-list" element={<SaleList />} />
              <Route path="/products" element={<Product />} />
              <Route path="/products-list" element={<ProductList />} />
              <Route path="/products-edit/:id" element={<ProductEdit />} />
              <Route path="/stock-management" element={<StockManagement />} />
              <Route path="/category" element={<Category />} />
              <Route path="/category-list" element={<CategoryList />} />
              <Route path="/category-edit/:id" element={<CategoryEdit />} />
              <Route path="/unit" element={<Unit />} />
              <Route path="/unit-list" element={<UnitList />} />
              <Route path="/unit-edit/:id" element={<UnitEdit />} />
              <Route path="/tables" element={<TableManagement />} />
              <Route path="/companies" element={<CompanyList />} />
              <Route path="/companies/create" element={<CompanyForm />} />
              <Route path="/companies/edit/:id" element={<CompanyForm />} />
              <Route path="/companies/:id" element={<CompanyForm />} />
              <Route path="/outlets" element={<OutletList />} />
              <Route path="/outlets/create" element={<OutletForm />} />
              <Route path="/outlets/edit/:id" element={<OutletForm />} />
              <Route path="/outlets/:id" element={<OutletForm />} />
              <Route path="/profile" element={<UserProfiles />} />
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
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
