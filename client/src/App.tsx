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

export default function App() {
  return (
    <div className="app">
      <Nav />
      <main className="main-content">

        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/order" element={<CustomerFlow />} />
          <Route element={<ProtectedRoute allowedRoles={['STAFF', 'MANAGER', 'ADMIN']} />}>
            <Route path="/baker" element={<BakerView />} />
          </Route>
          <Route
            element={
              <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']} />
            }
          >
            <Route path="/cakes/new" element={<CakeCreatePage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
