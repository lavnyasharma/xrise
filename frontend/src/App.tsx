import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { TicketSubmission } from '@/pages/TicketSubmission';
import { TicketStatus } from '@/pages/TicketStatus';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { TicketDetail } from '@/pages/TicketDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Public */}
              <Route path="/"       element={<TicketSubmission />} />
              <Route path="/status" element={<TicketStatus />} />
              <Route path="/login"  element={<Login />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard"    element={<Dashboard />} />
                <Route path="/tickets/:id"  element={<TicketDetail />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
