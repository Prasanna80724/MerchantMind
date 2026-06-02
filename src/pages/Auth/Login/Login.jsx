import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../context/AuthContext";
import AuthLayout from "../../../components/Layout/AuthLayout";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";

export default function Login() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const userLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await login({ loginUsername, loginPassword });
      if (response.status === 200) {
        toast.success("Welcome back!");
        setTimeout(() => navigate("/dashboard", { replace: true }), 800);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your MerchantMind account">
      <form onSubmit={userLogin} className="space-y-5">
        <Input
          label="Username"
          type="text"
          placeholder="Enter your username"
          value={loginUsername}
          onChange={(e) => setLoginUsername(e.target.value)}
          required
          autoComplete="username"
        />

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Remember me
          </label>
          <span className="text-slate-400">Forgot password?</span>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Sign in
        </Button>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
