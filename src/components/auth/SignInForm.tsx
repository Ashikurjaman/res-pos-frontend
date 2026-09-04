// src/components/auth/SignInForm.tsx
import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRateLimit } from "../../hooks/useRateLimit";
import { Eye, EyeOff, Loader2, Mail, User, Lock, AlertCircle } from "lucide-react";

export default function SignInForm() {
  const [loginIdentifier, setLoginIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loginType, setLoginType] = useState<"username" | "email">("username");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  // ✅ Rate limit: 5 attempts, 60 seconds cooldown
  const { isRateLimited, remainingAttempts, handleAttempt } = useRateLimit(5, 60);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        // ✅ Wrap signIn with rate limit handler
        await handleAttempt(async () => {
          return await signIn({
            usernameOrEmail: loginIdentifier,
            password,
            rememberMe,
          });
        });

        // ✅ If we get here, login was successful
        navigate("/dashboard");
      } catch (err: any) {
        console.error("Signin error:", err);

        // Check if it's a rate limit error (already shown by the hook)
        const isRateError = err?.status === 429 ||
                           err?.response?.status === 429 ||
                           err?.message?.includes('rate') ||
                           err?.message?.includes('429');

        if (!isRateError) {
          // Only show error if it's not a rate limit error (hook already shows SweetAlert)
          setError(err.message || "Invalid username/email or password");
        }
      } finally {
        setLoading(false);
      }
    },
    [loginIdentifier, password, rememberMe, signIn, navigate, handleAttempt],
  );

  const handleLoginTypeChange = useCallback((type: "username" | "email") => {
    setLoginType(type);
    setLoginIdentifier("");
    setError("");
  }, []);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const getPlaceholder = useCallback(() => {
    return loginType === "username" ? "Enter your username" : "you@example.com";
  }, [loginType]);

  const getInputType = useCallback(() => {
    if (loginType === "email") return "email";
    return "text";
  }, [loginType]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-block">
          <img
            width={180}
            height={40}
            src="/images/logo/logo.svg"
            alt="Logo"
            className="mx-auto"
          />
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
          Welcome Back
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Sign in to your account
        </p>
      </div>

      {/* Username/Email Toggle */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
        <button
          type="button"
          onClick={() => handleLoginTypeChange("username")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            loginType === "username"
              ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          } ${(loading || isRateLimited) ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={loginType === "username"}
          disabled={loading || isRateLimited}
        >
          <User size={14} className="inline mr-2" aria-hidden="true" />
          Username
        </button>
        <button
          type="button"
          onClick={() => handleLoginTypeChange("email")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            loginType === "email"
              ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          } ${(loading || isRateLimited) ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-pressed={loginType === "email"}
          disabled={loading || isRateLimited}
        >
          <Mail size={14} className="inline mr-2" aria-hidden="true" />
          Email
        </button>
      </div>

      {/* Rate Limit Warning - Visual indicator when rate limited */}
      {isRateLimited && (
        <div
          className="p-3 mb-4 text-sm text-yellow-800 bg-yellow-100 rounded-lg dark:bg-yellow-900/30 dark:text-yellow-200 flex items-start gap-2 border border-yellow-300 dark:border-yellow-700"
          role="alert"
          aria-live="polite"
          id="rate-limit-warning"
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium">Too many login attempts</p>
            <p>Please wait <strong>{remainingAttempts}</strong> seconds before trying again.</p>
          </div>
        </div>
      )}

      {/* Error Message - Only show non-rate-limit errors */}
      {error && !isRateLimited && (
        <div
          className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded-lg dark:bg-red-900/20 dark:text-red-400 flex items-start gap-2 border border-red-300 dark:border-red-800"
          role="alert"
          aria-live="polite"
        >
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="loginIdentifier"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {loginType === "username" ? "Username" : "Email Address"}
          </label>
          <div className="relative mt-1.5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {loginType === "username" ? (
                <User size={18} className="text-gray-400" aria-hidden="true" />
              ) : (
                <Mail size={18} className="text-gray-400" aria-hidden="true" />
              )}
            </div>
            <input
              id="loginIdentifier"
              type={getInputType()}
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRateLimited
                  ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                  : 'border-gray-300'
              }`}
              placeholder={getPlaceholder()}
              required
              disabled={loading || isRateLimited}
              autoComplete={loginType === "email" ? "email" : "username"}
              aria-label={loginType === "username" ? "Username" : "Email Address"}
              aria-describedby={isRateLimited ? "rate-limit-warning" : undefined}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Password
          </label>
          <div className="relative mt-1.5">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-gray-400" aria-hidden="true" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRateLimited
                  ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                  : 'border-gray-300'
              }`}
              placeholder="Enter your password"
              required
              disabled={loading || isRateLimited}
              autoComplete="current-password"
              aria-label="Password"
            />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={loading || isRateLimited}
            >
              {showPassword ? (
                <EyeOff size={20} aria-hidden="true" />
              ) : (
                <Eye size={20} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || isRateLimited}
              aria-label="Remember me"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </span>
          </label>
          <Link
            to="/reset-password"
            className={`text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 ${
              isRateLimited ? 'pointer-events-none opacity-50' : ''
            }`}
            tabIndex={isRateLimited ? -1 : 0}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading || isRateLimited}
          className={`w-full px-4 py-2.5 text-white rounded-lg focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-blue-800 transition duration-200 font-medium ${
            isRateLimited
              ? 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2
                size={20}
                className="mr-2 animate-spin"
                aria-hidden="true"
              />
              Signing in...
            </span>
          ) : isRateLimited ? (
            <span className="flex items-center justify-center">
              <AlertCircle size={18} className="mr-2" aria-hidden="true" />
              Wait {remainingAttempts}s
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className={`flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isRateLimited ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isRateLimited}
          aria-label="Sign in with Google"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>
        <button
          type="button"
          className={`flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isRateLimited ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isRateLimited}
          aria-label="Sign in with X"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X
        </button>
      </div>

      {/* Sign Up Link */}
      <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400">
        Don't have an account?{" "}
        <Link
          to="/signup"
          className={`font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 ${
            isRateLimited ? 'pointer-events-none opacity-50' : ''
          }`}
          tabIndex={isRateLimited ? -1 : 0}
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
}
