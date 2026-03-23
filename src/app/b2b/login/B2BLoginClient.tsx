"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function B2BLoginClient() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/b2b/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(`Welcome back, ${data.companyName}!`);
                setTimeout(() => {
                    window.location.href = "/b2b/account";
                }, 1000);
            } else {
                toast.error(data.error || "Login failed");
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="b2b-login-page">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="b2b-login-card">
                <div className="text-center mb-4">
                    <img
                        src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566375/hallmark/assets/img/logo-white.png"
                        alt="HallMark Logo"
                        className="login-logo"
                        loading="lazy"
                    />
                    <h2 className="title mt-3">B2B Portal</h2>
                    <p className="subtitle">Sign in to access wholesale pricing</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group mb-3">
                        <label>Username</label>
                        <div className="input-with-icon">
                            <i className="bi bi-person"></i>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group mb-4">
                        <label>Password</label>
                        <div className="input-with-icon">
                            <i className="bi bi-lock"></i>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`btn-login ${loading ? "loading" : ""}`}
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                    <div className="text-center mt-4 back-link-wrap">
                        <Link href="/" className="back-link">
                            <i className="bi bi-arrow-left"></i> Back to Main Website
                        </Link>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .b2b-login-page {
                    min-height: calc(100vh - 110px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f8fafc;
                    padding: 2rem 1rem;
                    margin-top: 110px;
                    font-family: 'Inter', sans-serif;
                }
                @media (max-width: 767px) {
                    .b2b-login-page {
                        align-items: flex-start;
                        padding-top: 40px;
                        padding-bottom: 3rem;
                        margin-top: 150px;
                        min-height: calc(100vh - 150px);
                    }
                }
                .b2b-login-card {
                    background: #ffffff;
                    width: 100%;
                    max-width: 440px;
                    padding: 3rem 2.5rem;
                    border-radius: 24px;
                    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
                    border: 1px solid #f1f5f9;
                }
                .login-logo {
                    max-height: 80px;
                    width: auto;
                    filter: invert(1);
                }
                .title {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 0.25rem;
                }
                .subtitle {
                    color: #64748b;
                    font-size: 0.9375rem;
                }
                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: #475569;
                }
                .input-with-icon {
                    position: relative;
                }
                .input-with-icon i {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    font-size: 1.1rem;
                }
                .form-control {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 2.75rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: #f8fafc;
                    transition: all 0.2s;
                    font-size: 1rem;
                }
                .form-control:focus {
                    outline: none;
                    border-color: #ffc451;
                    box-shadow: 0 0 0 4px rgba(255,196,81,0.1);
                    background: #fff;
                }
                .btn-login {
                    width: 100%;
                    padding: 1rem;
                    background: #ffc451;
                    color: #1e293b;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(255, 196, 81, 0.2);
                }
                .btn-login:hover:not(:disabled) {
                    background: #f8b42d;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(255, 196, 81, 0.3);
                }
                .btn-login.loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .back-link-wrap {
                    margin-top: 1.5rem;
                }
                .back-link {
                    color: #64748b;
                    text-decoration: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: 0.2s;
                }
                .back-link:hover {
                    color: #ffc451;
                }
            `}</style>
        </div>
    );
}
