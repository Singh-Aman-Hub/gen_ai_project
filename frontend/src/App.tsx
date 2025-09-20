import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import UploadPage from "./components/UploadPage";
import SummaryView from "./components/SummaryView";
import Chatbot from "./components/Chatbot";
import Policies from "./pages/Policies";
import { GoogleOAuthProvider } from "@react-oauth/google";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
            <BrowserRouter>
              <ErrorBoundary>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes wrapped in AppLayout */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout>
                    <Outlet />
                  </AppLayout>
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/upload"
                  element={
                    <UploadPage
                      onFileUpload={async (file: File) => {
                        // TODO: Implement file upload logic here
                        // For now, just log the file
                        console.log("File uploaded:", file);
                      }}
                    />
                  }
                />
                <Route path="/summary" element={<SummaryView />} />
                <Route
                  path="/chat"
                  element={
                    <Chatbot
                      onSendMessage={async (message: string) => {
                        // TODO: Implement message sending logic here
                        // For now, just echo the message
                        return `You saixd: ${message}`;
                      }}
                    />
                  }
                />
                <Route path="/policies" element={<Policies />} />
              
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
              </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </GoogleOAuthProvider>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
