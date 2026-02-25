import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MobileShell from "@/components/MobileShell";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Watch from "./pages/Watch";
import Plans from "./pages/Plans";
import Admin from "./pages/Admin";
import Creator from "./pages/Creator";
import Profile from "./pages/Profile";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RefundPolicy from "./pages/RefundPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import NotFound from "./pages/NotFound";
import { Play, ShieldAlert, LogOut } from "lucide-react";

const queryClient = new QueryClient();

/** Shown when a different device is detected for this account */
const DeviceBlockedScreen = ({ reason, onSignOut }: { reason: string; onSignOut: () => void }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
    <div className="w-16 h-16 bg-destructive/10 border border-destructive/30 rounded-sm flex items-center justify-center mb-6">
      <ShieldAlert className="w-8 h-8 text-destructive" />
    </div>
    <h1 className="cinzel text-2xl font-bold text-foreground mb-2">Device Not Recognised</h1>
    <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8">
      {reason || "This account is registered to a different device. For security, only one device per account is permitted."}
    </p>
    <div className="space-y-3 w-full max-w-xs">
      <p className="text-xs text-muted-foreground">
        If you have a new device, please contact support to reset your device lock.
      </p>
      <button
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface border border-gold/20 hover:border-gold/50 rounded-sm text-sm font-medium text-foreground transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
    <div className="mt-10 flex items-center gap-2 opacity-40">
      <div className="w-6 h-6 gradient-gold rounded-sm flex items-center justify-center">
        <Play className="w-3 h-3 fill-background text-background" />
      </div>
      <span className="cinzel text-xs font-bold text-gold tracking-wider">HABESHA STREAMS</span>
    </div>
  </div>
);

/** Inner app that has access to AuthContext */
const AppRoutes = () => {
  const { deviceBlocked, deviceBlockReason, signOut } = useAuth();

  if (deviceBlocked) {
    return (
      <DeviceBlockedScreen
        reason={deviceBlockReason ?? ""}
        onSignOut={signOut}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/watch/:id" element={<Watch />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/subscription-success" element={<SubscriptionSuccess />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creator"
        element={
          <ProtectedRoute requiredRole="creator">
            <Creator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MobileShell />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
