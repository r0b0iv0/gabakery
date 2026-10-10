import { Routes, Route } from 'react-router-dom';
import { Nav } from './components/Nav';
import { MainPage } from './pages/MainPage';
import { CustomerFlow } from './pages/CustomerFlow';
import { BakerView } from './pages/BakerView';
import { LoginPage } from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Footer } from './components/Footer';
import { CakeCreatePage } from './pages/CakeCreatePage';
import { IngredientsPage } from './pages/IngredientsPage';
import { OrderManagementPage } from './pages/OrdermanagementPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { CakeDetailPage } from './pages/CakeDetailPage';
import { CartProvider } from './contexts/CartContext';

export default function App() {
  return (
    <div className="app">
      <Nav />
      <main className="main-content">
        <CartProvider>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/order" element={<CustomerFlow />} />
            <Route path="/cakes/:id" element={<CakeDetailPage />} />
            <Route element={<ProtectedRoute allowedRoles={['STAFF', 'MANAGER', 'ADMIN']} />}>
              <Route path="/baker" element={<BakerView />} />
            </Route>
            <Route
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} />
              }
            >
              <Route path="/cakes/new" element={<CakeCreatePage />} />
              <Route path="/ingredients" element={<IngredientsPage />} />
              <Route path="/orders/manage" element={<OrderManagementPage />} />
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </CartProvider>
      </main>
      <Footer />
    </div>
  );
}
