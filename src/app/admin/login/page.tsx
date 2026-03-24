"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminToast } from "@/components/AdminToast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otp = digits.join("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const router = useRouter();
  const { showToast, ToastComponent } = useAdminToast();

  const [loading, setLoading] = useState(false);

  // for testing purpose need to show the OTP in the OTP screen
  const [showOtp, setShowOtp] = useState(false);
  const [otpTest, setOtpTest] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        showToast("OTP sent successfully", "success");
      } else {
        // for testing purpose need to show the OTP in the OTP screen
        setOtpTest(data.otp);
        setShowOtp(true);
        showToast(data.error || "Failed to send OTP", "error");
      }
    } catch (error) {
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        // Store user info for client-side permissions check
        if (data.admin) {
          localStorage.setItem("admin_user", JSON.stringify(data.admin));
        }
        showToast("Login successful!", "success");
        setTimeout(() => router.push("/admin"), 500);
      } else {
        showToast(data.error || "Invalid OTP", "error");
      }
    } catch (error) {
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="admin-login-container">
      {ToastComponent}
      <div className="login-card">
        <div className="login-header">
          <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566375/hallmark/assets/img/logo-white.png" alt="HallMark Logo" className="logo-img" />
          <p>{step === 1 ? "Enter your email to receive OTP" : "Enter the 6-digit code sent to your email"}</p>
        </div>

        <form onSubmit={step === 1 ? handleSendOtp : handleLogin} className="login-form">
          {step === 1 ? (
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hallmark.com"
                required
              />

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Processing..." : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="form-group">
              <label>OTP Code</label>
              <div className="otp-inputs">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { digitRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    className="otp-box"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(-1);
                      const next = [...digits];
                      next[i] = val;
                      setDigits(next);
                      if (val && i < 5) digitRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digits[i] && i > 0) {
                        digitRefs.current[i - 1]?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      if (!pasted) return;
                      const next = ["", "", "", "", "", ""];
                      pasted.split("").forEach((ch, idx) => { next[idx] = ch; });
                      setDigits(next);
                      const focusIdx = Math.min(pasted.length, 5);
                      digitRefs.current[focusIdx]?.focus();
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>
              {showOtp && (
                <p style={{ color: "#fff", textAlign: "center", marginTop: "1rem" }}>OTP: {otpTest}</p>
              )}
              <button type="submit" className="login-btn" disabled={loading || otp.length < 6}>
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
              <button type="button" className="back-btn" onClick={() => { setStep(1); setDigits(["", "", "", "", "", ""]); }} disabled={loading}>Back to Email</button>
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        .admin-login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          font-family: var(--default-font);
        }

        .login-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          padding: 3rem;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 450px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header h1 {
          color: #fff;
          font-size: 2rem;
          margin-bottom: 0.5rem;
          font-family: var(--heading-font);
          text-align: center;
        }

        .login-header p {
          color: #94a3b8;
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        label {
          color: #e2e8f0;
          font-size: 0.9rem;
          margin-bottom: -1rem;
        }

        input {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          color: #fff;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        input:focus {
          outline: none;
          border-color: #38bdf8;
          box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
        }

        .login-btn {
          background: #38bdf8;
          color: #0f172a;
          padding: 1rem;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .login-btn:hover {
          background: #7dd3fc;
          transform: translateY(-2px);
        }

        .back-btn {
          background: transparent;
          color: #94a3b8;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: underline;
        }

        .back-btn:hover {
          color: #fff;
        }

        .otp-inputs {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .otp-box {
          width: 48px !important;
          height: 56px !important;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          border-radius: 12px;
          padding: 0 !important;
          caret-color: #38bdf8;
        }

        .login-header .logo-img {
          width: 250px;
          height: auto;
          display: block;
          margin: 0 auto 0.5rem;
        }

        @media (max-width: 768px) {
          .admin-login-container {
            padding: 1rem;
          }
          .login-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
          }
          .login-header .logo-img {
            width: 200px;
          }
          .otp-inputs {
            gap: 0.35rem;
          }
          .otp-box {
            width: 42px !important;
            height: 50px !important;
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
