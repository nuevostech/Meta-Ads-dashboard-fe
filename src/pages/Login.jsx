
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("vidhya@ntqsdigital.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Connect your admin login API here.
    // This navigation is only for UI testing.
    navigate("/");
  };

  return (
    <div className="login-page">

      {/* Left Side */}
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

      {/* Right Side */}
      <section className="login-right">

        <div className="login-form-container">

          <div className="login-form-heading">
            <h1>Welcome back</h1>
            <p>Sign in to check your client accounts.</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="login-field">
              <label htmlFor="login-email">Work email</label>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="login-password">Password</label>

              <div className="login-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  className="login-show-password"
                  onClick={() => setShowPassword(!showPassword)}
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

            {/* Sign In */}
            <button type="submit" className="login-submit">
              Sign in
            </button>

          </form>

          {/* Footer */}
          <div className="login-footer">

            <p>
              Need access? Ask your team admin to invite you.
            </p>

            <div className="login-footer-divider"></div>

            <span>Read-only access to Meta ad accounts</span>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Login;
