import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { normalizeError } from "../api/errors.js";
import { useAuth } from "../context/AuthContext.jsx";
import { usingMocks } from "../api/index.js";
import ErrorBanner from "./ErrorBanner.jsx";
import FormField from "./FormField.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm() {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required.";
    else if (!emailPattern.test(email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Password is required.";
    setErrors(nextErrors);
    setMessage("");
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await loginUser({ email: email.trim(), password });
    } catch (error) {
      const normalized = normalizeError(error);
      setMessage(normalized.detail);
      setErrors(normalized.fieldErrors);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {message && <ErrorBanner message={message} />}
      <FormField label="Email" error={errors.email}>
        {(id, errorId) => (
          <input
            id={id}
            className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2.5 focus:ring-4 focus:ring-sky/60"
            type="email"
            autoComplete="email"
            value={email}
            aria-describedby={errorId}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </FormField>
      <FormField label="Password" error={errors.password}>
        {(id, errorId) => (
          <div className="relative">
            <input
              id={id}
              className="w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2.5 pr-12 focus:ring-4 focus:ring-sky/60"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              aria-describedby={errorId}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button className="absolute inset-y-0 right-0 flex items-center px-3" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((shown) => !shown)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        )}
      </FormField>
      {usingMocks && (
        <div className="rounded-xl border-[3px] border-ink bg-sun/30 px-4 py-3 text-sm">
          <p className="font-semibold">Demo account</p>
          <p className="mt-1">demo@sparkmatch.app / Demo@1234</p>
        </div>
      )}
      <button className="flex w-full items-center justify-center gap-2 rounded-xl border-[3px] border-ink bg-spark px-5 py-3 font-extrabold text-ink shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-spark-dark active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={loading}>
        {loading && <span className="flex gap-1" aria-hidden="true"><i className="h-2 w-2 rounded-full bg-violet motion-safe:animate-bounce" /><i className="h-2 w-2 rounded-full bg-pink motion-safe:animate-bounce [animation-delay:100ms]" /><i className="h-2 w-2 rounded-full bg-sky motion-safe:animate-bounce [animation-delay:200ms]" /></span>}
        {loading ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
