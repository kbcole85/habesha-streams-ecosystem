import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye, EyeOff, Play, Mail, Lock, User, AlertCircle,
  CheckCircle2, Loader2, Fingerprint, Scan, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { useNativePlatform } from "@/hooks/useNativePlatform";

type Mode = "login" | "signup";

const BiometricIcon = ({ type, className }: { type: string; className?: string }) => {
  if (type === "face") return <Scan className={className} />;
  return <Fingerprint className={className} />;
};

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [offerBiometric, setOfferBiometric] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/";

  const { isNative } = useNativePlatform();
  const bio = useBiometricAuth();

  // Check biometric availability on mount (native only)
  useEffect(() => {
    if (isNative) {
      bio.checkAvailability();
    }
  }, [isNative]);

  // Show biometric button if on native + available
  const showBiometric = isNative && bio.isAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "signup") {
      if (!displayName.trim()) { setError("Please enter your name."); setLoading(false); return; }
      if (password.length < 8) { setError("Password must be at least 8 characters."); setLoading(false); return; }
      const { error: err } = await signUp(email, password, displayName);
      if (err) {
        setError(err.message);
      } else {
        setSuccess("Account created! Please check your email to verify, then sign in.");
        setMode("login");
        setPassword("");
      }
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message.includes("Invalid login") ? "Invalid email or password." : err.message);
      } else {
        // After successful login on native, offer to save biometric credentials
        if (isNative && bio.isAvailable) {
          await bio.saveCredentials(email, password);
          setOfferBiometric(true);
        }
        navigate(from, { replace: true });
      }
    }
    setLoading(false);
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    setError(null);
    try {
      const verified = await bio.authenticate("Sign in to Habesha Streams");
      if (!verified) {
        setError("Biometric authentication cancelled or failed.");
        setBiometricLoading(false);
        return;
      }
      const creds = await bio.getStoredCredentials();
      if (!creds) {
        setError("No saved credentials found. Please sign in with your password first.");
        setBiometricLoading(false);
        return;
      }
      const { error: err } = await signIn(creds.email, creds.password);
      if (err) {
        setError("Stored credentials are no longer valid. Please sign in with your password.");
        await bio.deleteStoredCredentials();
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      setError("Biometric authentication failed. Please try your password.");
    }
    setBiometricLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-gold rounded-sm flex items-center justify-center shadow-gold">
            <Play className="w-4 h-4 fill-background text-background" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="cinzel text-base font-bold text-gold tracking-wider">HABESHA</span>
            <span className="text-[8px] tracking-[0.3em] text-muted-foreground font-medium uppercase">STREAMS</span>
          </div>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </div>

      {/* Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="h-0.5 w-full gradient-gold mb-8 rounded-full" />

          {/* Tabs */}
          <div className="flex bg-surface rounded-sm p-1 mb-8 border border-gold/10">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-sm transition-all duration-200 ${
                  mode === m
                    ? "gradient-gold text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="cinzel text-2xl font-bold text-foreground mb-1">
              {mode === "login" ? "Welcome Back" : "Join Habesha Streams"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Sign in to continue watching your favourite East African content."
                : "Create your account and start your 7-day free trial."}
            </p>
          </div>

          {/* Biometric Login Button (native only) */}
          {showBiometric && mode === "login" && (
            <button
              onClick={handleBiometricLogin}
              disabled={biometricLoading}
              className="w-full mb-5 flex items-center justify-center gap-3 py-3.5 bg-surface border-2 border-gold/30 hover:border-gold/70 rounded-sm transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {biometricLoading ? (
                <Loader2 className="w-5 h-5 text-gold animate-spin" />
              ) : (
                <BiometricIcon
                  type={bio.biometricType}
                  className="w-5 h-5 text-gold group-hover:scale-110 transition-transform"
                />
              )}
              <span className="text-sm font-semibold text-foreground">
                {biometricLoading
                  ? "Authenticating…"
                  : bio.biometricType === "face"
                  ? "Sign in with Face ID"
                  : "Sign in with Fingerprint"}
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-gold/60" />
            </button>
          )}

          {/* Divider */}
          {showBiometric && mode === "login" && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gold/10" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">or use password</span>
              <div className="flex-1 h-px bg-gold/10" />
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-destructive/10 border border-destructive/30 rounded-sm">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-emerald/10 border border-emerald/30 rounded-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Mikiyas Haile"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-gold/15 focus:border-gold/50 rounded-sm text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-gold/15 focus:border-gold/50 rounded-sm text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-surface border border-gold/15 focus:border-gold/50 rounded-sm text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Save biometric opt-in for signup */}
            {mode === "signup" && isNative && bio.isAvailable && (
              <div className="flex items-center gap-2.5 p-3 bg-gold/5 border border-gold/15 rounded-sm">
                <BiometricIcon type={bio.biometricType} className="w-4 h-4 text-gold flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  After sign-up, you can enable{" "}
                  <span className="text-gold font-medium">
                    {bio.biometricType === "face" ? "Face ID" : "Fingerprint"} login
                  </span>{" "}
                  for faster, secure access.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 gradient-gold text-background font-bold text-sm rounded-sm hover:opacity-90 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create My Account"}
            </button>
          </form>

          {mode === "signup" && (
            <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
              By creating an account you agree to our{" "}
              <span className="text-gold cursor-pointer hover:underline">Terms of Service</span> and{" "}
              <span className="text-gold cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          )}

          <div className="mt-6 pt-6 border-t border-gold/10 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-gold hover:underline font-medium"
              >
                {mode === "login" ? "Sign up free" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {["7-day free trial", "Cancel anytime", isNative ? "Biometric login" : "Secure & encrypted"].map((t) => (
              <div key={t} className="text-center p-2 bg-surface rounded-sm border border-gold/5">
                <p className="text-[10px] text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
