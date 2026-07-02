import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import {
  Mail,
  ChevronDown,
  Loader2,
  Vote,
  MapPin,
  LifeBuoy,
  X,
  Lock,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

const ROLES = ["Admin", "Adviser", "Officer", "Voter"];

export default function Login() {
  const { findAccount, loginWithPassword, setPasswordAndLogin } = useAuth();

  const [step, setStep] = useState("credentials"); // credentials | password | otp | changePassword
  const [role, setRole] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [found, setFound] = useState(null); // { account, entity }
  const [googleVerified, setGoogleVerified] = useState(false);

  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const inputClass =
    "w-full h-12 pl-11 pr-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300";

  const sendOtp = async () => {
    setSendingOtp(true);
    setError("");
    try {
      const res = await base44.auth.requestOtp(email);
      // In local mode the code comes back as `preview` (shown on screen for
      // testing). In live mode it's delivered to Gmail only — no preview.
      setSentOtp(res?.preview || "");
    } catch (err) {
      setError(err.message || "Could not send one-time password.");
    } finally {
      setSendingOtp(false);
    }
  };

  const redirectAfterLogin = (session) => {
    if (session.type === "voter") {
      if (!session.track || !session.section) {
        window.location.href = "/confirm-info";
        return;
      }
      window.location.href = "/vote";
      return;
    }
    window.location.href = "/";
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    if (!role) {
      setError("Please select your role");
      return;
    }
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const result = await findAccount(role, email);
      if (!result) {
        setError("No account found for this email and role.");
        return;
      }
      // Simulated Google sign-in to confirm the email is a valid Google account.
      const googleUser = await base44.auth.loginWithProvider(
        "google",
        null,
        email
      );
      if (!googleUser?.verified) {
        setError("Google verification failed.");
        return;
      }
      if (
        googleUser.email &&
        googleUser.email.toLowerCase() !== email.trim().toLowerCase()
      ) {
        setError("The Google account email does not match the entered email.");
        return;
      }
      setFound(result);
      setGoogleVerified(true);
      if (result.account.password_changed) {
        setStep("password");
      } else {
        await sendOtp();
        setStep("otp");
      }
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await loginWithPassword(found, password);
      redirectAfterLogin(session);
    } catch (err) {
      setError(err.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.auth.verifyOtp(email, otp);
      if (!res?.valid) {
        setError("Incorrect one-time password.");
        return;
      }
      setStep("changePassword");
    } catch (err) {
      setError(err.message || "Incorrect one-time password.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const session = await setPasswordAndLogin(found, newPassword);
      redirectAfterLogin(session);
    } catch (err) {
      setError(err.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const resetToCredentials = () => {
    setStep("credentials");
    setFound(null);
    setGoogleVerified(false);
    setPassword("");
    setOtp("");
    setSentOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const stepTitle = {
    credentials: { title: "Login", sub: "Sign in to your account" },
    password: { title: "Enter Password", sub: googleVerified ? "Google verified" : "" },
    otp: { title: "One-Time Password", sub: "First-time login verification" },
    changePassword: { title: "Set New Password", sub: "Choose a password for future logins" },
  }[step];

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://media.base44.com/images/public/6a4025497f9cee1bfecbfb91/5c723e29f_image.png')",
        }}
      />
      <div className="absolute inset-0 backdrop-blur-md bg-black/50" />

      <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-3 shadow-lg shadow-black/10">
        <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
          <img
            src="https://media.base44.com/images/public/6a4025497f9cee1bfecbfb91/792499523_image.png"
            alt="Iloilo National High School logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900 tracking-tight">
            Iloilo National High School
          </p>
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            La Paz, Iloilo City
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-7">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {stepTitle.title}
                </h1>
                <p className="text-blue-200 text-sm">{stepTitle.sub}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {step !== "credentials" && (
              <button
                type="button"
                onClick={resetToCredentials}
                className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Start over
              </button>
            )}

            {/* Step 1 — Role + Email + Google verification */}
            {step === "credentials" && (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setRoleOpen(!roleOpen)}
                      className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-gray-50 text-left flex items-center justify-between text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-300"
                    >
                      <span className={role ? "text-gray-900" : "text-gray-400"}>
                        {role || "Select your role"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          roleOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {roleOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 overflow-hidden">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              setRole(r);
                              setRoleOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-sm text-left transition-colors hover:bg-blue-50 hover:text-blue-700 ${
                              role === r
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.35 11.1H12v2.9h5.35c-.23 1.4-1.6 4.1-5.35 4.1A6.1 6.1 0 0 1 5.9 12 6.1 6.1 0 0 1 12 5.9c1.7 0 2.85.73 3.5 1.36l2.38-2.29A9.3 9.3 0 0 0 12 2.5 9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.48 0 9.1-3.85 9.1-9.27 0-.62-.07-1.1-.25-1.13z" />
                      </svg>
                      Verify with Google
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2 — Password (existing users) */}
            {step === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Google account verified for {email}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            )}

            {/* Step 3 — OTP (first-time login) */}
            {step === "otp" && (
              <form onSubmit={handleOtpVerify} className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Google account verified for {email}
                </div>
                <p className="text-sm text-gray-600">
                  We sent a one-time password to your Gmail. Enter it below to
                  continue.
                </p>
                <div className="space-y-1.5">
                  <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                    One-Time Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="otp"
                      type="text"
                      autoComplete="one-time-code"
                      placeholder="One-time password"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
                {sentOtp && (
                  <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs leading-relaxed">
                    <span className="font-semibold">Preview mode:</span> your
                    one-time password is{" "}
                    <span className="font-mono font-bold tracking-wider">{sentOtp}</span>
                    . (In production this is delivered to your Gmail only.)
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sendingOtp}
                    className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-60"
                  >
                    {sendingOtp ? "Resending…" : "Resend code"}
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify
                </button>
              </form>
            )}

            {/* Step 4 — Set new password */}
            {step === "changePassword" && (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  One-time password verified
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Set Password & Continue"
                  )}
                </button>
              </form>
            )}

            {step === "credentials" && (
              <button
                type="button"
                onClick={() => setShowSupport(true)}
                className="mt-6 block mx-auto text-sm text-blue-600 font-medium hover:underline"
              >
                Don't have an account?
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-white/50 mt-6">
          © 2025 Iloilo National High School Election System
        </p>
      </div>

      {showSupport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowSupport(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSupport(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
              <LifeBuoy className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Need an account?
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Visit the <span className="font-semibold text-gray-900">ICT Building</span> for Technical Support to get your account set up.
            </p>
            <button
              type="button"
              onClick={() => setShowSupport(false)}
              className="mt-6 w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}