import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { supabase } from './utils/supabase';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/admin/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProductFormPage from './pages/ProductFormPage';
import NotFoundPage from './pages/NotFoundPage';
import AnalyticsTracker from './components/AnalyticsTracker';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    async function getTodos() {
      const { data: todos } = await supabase.from('todos').select();

      if (todos) {
        setTodos(todos);
      }
    }

    getTodos();
  }, []);

  return (
    <>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
      <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AnalyticsTracker />
          <Navbar />
          <Suspense fallback={<div className="loading-skeleton"></div>}>
            <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <ProtectedRoute>
              <ProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id/edit"
          element={
            <ProtectedRoute>
              <ProductFormPage />
            </ProtectedRoute>
          }
        />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <Footer />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
    </>
  );
}

export default App;
