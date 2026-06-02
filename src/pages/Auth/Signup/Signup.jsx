import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../context/AuthContext";
import AuthLayout from "../../../components/Layout/AuthLayout";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signup } = useAuth();

  const createUser = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await signup({ Email: email, Username: username, Password: password });
      if (response.status === 201) {
        toast.success("Account created! Redirecting to login...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start managing inventory in minutes">
      <form onSubmit={createUser} className="space-y-5">
        <Input label="Email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label="Username" type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />

        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 chars, uppercase, number, symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500">Must include uppercase, number, and special character.</p>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account
        </Button>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
