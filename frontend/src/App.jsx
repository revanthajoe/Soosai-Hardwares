import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/admin/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import AnalyticsTracker from './components/AnalyticsTracker';
import './App.css';

// Admin screens are loaded on demand. Nothing here is reachable to a customer,
// and the dashboard pulls in recharts, so keeping these eager put roughly a
// third of the main bundle in front of every storefront visitor.
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage'));
const AdFormPage = lazy(() => import('./pages/AdFormPage'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AnalyticsTracker />
          <Navbar />
          <main style={{ flex: 1 }}>
            <Suspense fallback={<div className="loading-skeleton" style={{ margin: '1rem' }}></div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/admin/products/new" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
                <Route path="/admin/products/:id/edit" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
                <Route path="/admin/ads/new" element={<ProtectedRoute><AdFormPage /></ProtectedRoute>} />
                <Route path="/admin/ads/:id/edit" element={<ProtectedRoute><AdFormPage /></ProtectedRoute>} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
