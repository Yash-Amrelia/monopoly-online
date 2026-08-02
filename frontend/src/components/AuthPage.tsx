import React, { useState } from "react";
import { User, Lock, Award, Gamepad2 } from "lucide-react";

interface AuthPageProps {
  onAuthSuccess: (token: string, username: string) => void;
  apiBaseUrl: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, apiBaseUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (isLogin) {
        onAuthSuccess(data.access_token, username);
      } else {
        // Automatically switch to login on successful registration
        setIsLogin(true);
        setUsername(username);
        setPassword("");
        setError("Account created! Please sign in.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-darker px-4 relative overflow-hidden">
      {/* Radiant Background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary rounded-full filter blur-[150px] opacity-20 pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent rounded-full filter blur-[150px] opacity-15 pointer-events-none animate-pulse"></div>

      <div className="w-full max-w-md glass p-8 rounded-2xl glow-purple border border-white/10 relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-brand-primary/20 rounded-full mb-3 text-brand-accent border border-brand-primary/30">
            <Gamepad2 className="w-10 h-10 animate-bounce" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-accent bg-clip-text text-transparent">
            MONOPOLY ONLINE
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center">
            {isLogin ? "Sign in to join multiplayer lobbies" : "Create a new player account"}
          </p>
        </div>

        {error && (
          <div className={`p-3 rounded-lg mb-6 text-sm text-center border ${
            error.includes("created") 
              ? "bg-brand-success/15 border-brand-success/30 text-brand-success" 
              : "bg-brand-danger/15 border-brand-danger/30 text-brand-danger"
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-brand-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-dark border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-brand-primary/30 transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register Account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          {isLogin ? (
            <span>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(""); }}
                className="text-brand-accent hover:underline font-semibold"
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(""); }}
                className="text-brand-accent hover:underline font-semibold"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
      
      {/* Features Footer info */}
      <div className="mt-12 text-slate-500 text-xs flex items-center gap-2">
        <Award className="w-4 h-4 text-brand-accent" />
        <span>Multiplayer WebSockets • Local DB Profiles • Smart AI Bot Opponents</span>
      </div>
    </div>
  );
};

export default AuthPage;
