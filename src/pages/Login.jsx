
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// API configuration
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
).replace(/\/+$/, "");

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================
  // LOGIN SUBMIT
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Read actual input values from the form.
      // This also helps when Chrome autofills without
      // triggering React's onChange event.
      const formData = new FormData(e.currentTarget);

      const submittedEmail = String(
        formData.get("username") || email
      ).trim();

      const submittedPassword = String(
        formData.get("password") || password
      );

      if (!submittedEmail || !submittedPassword) {
        throw new Error("Please enter your email and password.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: submittedEmail,
            password: submittedPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Invalid email or password"
        );
      }

      if (!data.token) {
        throw new Error("Login successful, but authentication token is missing.");
      }

      // Clear previous login details
      localStorage.removeItem("token");
      localStorage.removeItem("adminUser");

      sessionStorage.removeItem("token");
      sessionStorage.removeItem("adminUser");

      // Store details based on Remember Me
      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem("token", data.token);
      storage.setItem("adminUser", JSON.stringify(data.user));

      // Navigate to dashboard
      navigate("/dashboard");

    } catch (error) {
      setError(
        error.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div className="login-page">

      {/* =====================================
          LEFT SIDE
      ===================================== */}

      <section className="login-left">

        {/* Brand */}
        <div className="login-brand">
          <div className="brand-logo">N</div>

          <div>
            <h2>NTQS Digital</h2>
            <p>Shootza • Ads Monitor</p>
          </div>
        </div>

        {/* Main Heading */}
        <div className="login-hero">
          <h1>
            Never let a client's
            <br />
            ads <span>stop running.</span>
          </h1>

          <p>
            Track prepaid balances, campaign delivery and spend for
            <br className="desktop-break" />
            every Meta ad account in one place.
          </p>
        </div>

        {/* Monthly Spend Card */}
        <div className="login-spend-card">
          <p>Monthly ad spend</p>
          <h2>₹1,96,000</h2>
          <span>▲ 12% vs last month</span>
        </div>

        {/* Account Balance Card */}
        <div className="login-account-card">

          <div className="login-account-header">
            <h3>Shootza</h3>
            <span>Low Balance</span>
          </div>

          <p>Prepaid balance</p>
          <h2>₹1,200</h2>

          <div className="login-progress">
            <div></div>
          </div>

        </div>

        {/* Critical Alert */}
        <div className="login-alert-card">
          <div className="login-alert-icon">!</div>

          <div>
            <h3>Client A, critical balance</h3>
            <p>Balance ₹450, below ₹500.</p>
          </div>
        </div>

      </section>

      {/* =====================================
          RIGHT SIDE
      ===================================== */}

      <section className="login-right">

        <div className="login-form-container">

          {/* Heading */}
          <div className="login-form-heading">
            <h1>Welcome back</h1>
            <p>Sign in to check your client accounts.</p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
          >

            {/* Email */}
            <div className="login-field">
              <label htmlFor="login-email">
                Work email
              </label>

              <input
  id="login-email"
  name="login-email"
  type="email"
  autoComplete="off"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter your work email"
  required
/>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="login-password-wrapper">

                <input
  id="login-password"
  name="login-password"
  type={showPassword ? "text" : "password"}
  autoComplete="new-password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter your password"
  required
/>

                <button
                  type="button"
                  className="login-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>
            </div>

            {/* Remember Me */}
            <div className="login-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />

                <span className="remember-toggle"></span>

                <span>Keep me signed in</span>

              </label>

              <button
                type="button"
                className="forgot-password"
              >
                Forgot password?
              </button>

            </div>

            {/* Error Message */}
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            {/* Sign In */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          {/* Footer */}
          <div className="login-footer">

            <p>
              Need access? Ask your team admin to invite you.
            </p>

            <div className="login-footer-divider"></div>

            <span>
              Read-only access to Meta ad accounts
            </span>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Login;
