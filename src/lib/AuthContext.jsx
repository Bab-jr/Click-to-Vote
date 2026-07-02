import React, { createContext, useState, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { hashPassword, verifyPassword } from "@/lib/password";

const AuthContext = createContext();
const SESSION_KEY = "election_session";

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normEmail = (email) => (email || "").trim().toLowerCase();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadSession);

  // Look up an account in the system's local store by role + email.
  // Officers must also match the selected role (admin/adviser/officer).
  const findAccount = async (role, email) => {
    const emailLower = normEmail(email);
    if (role === "Voter") {
      const voters = await base44.entities.Voter.filter({});
      const match = voters.find((v) => normEmail(v.email) === emailLower);
      return match ? { account: match, entity: "Voter" } : null;
    }
    const officers = await base44.entities.Officer.filter({});
    const targetRole = role.toLowerCase();
    const match = officers.find(
      (o) => normEmail(o.email) === emailLower && o.role === targetRole
    );
    return match ? { account: match, entity: "Officer" } : null;
  };

  const buildSession = (account, entity) => {
    if (entity === "Voter") {
      return {
        id: account.id,
        name: account.name,
        email: account.email,
        role: "voter",
        type: "voter",
        election_id: account.election_id,
        track: account.track,
        grade: account.grade,
        section: account.section,
        cluster: account.cluster,
        user_id: account.user_id,
      };
    }
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      type: "officer",
      election_id: account.election_id,
      track: account.track,
      grade: account.grade,
      section: account.section,
      user_id: account.user_id,
    };
  };

  const completeLogin = (session) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  };

  // Existing account that already set a password — verify the hash and
  // log in. Legacy plaintext passwords (seeded admin) are accepted and
  // transparently upgraded to a PBKDF2 hash on first successful login.
  const loginWithPassword = async ({ account, entity }, password) => {
    const ok = await verifyPassword(password, account.password);
    if (!ok) throw new Error("Invalid password");
    if (account.password && !account.password.startsWith("pbkdf2$")) {
      try {
        const hash = await hashPassword(password);
        await base44.entities[entity].update(account.id, { password: hash });
      } catch {
        // non-blocking migration
      }
    }
    return completeLogin(buildSession(account, entity));
  };

  // First-time login — set a new password (after OTP) and log in.
  const setPasswordAndLogin = async ({ account, entity }, newPassword) => {
    const hash = await hashPassword(newPassword);
    const updated = await base44.entities[entity].update(account.id, {
      password: hash,
      password_changed: true,
    });
    return completeLogin(buildSession(updated, entity));
  };

  // Voter confirms their track + section after first login.
  const updateVoterInfo = async (voterId, { track, section }) => {
    const updated = await base44.entities.Voter.update(voterId, {
      track,
      section,
    });
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const sess = JSON.parse(raw);
        if (sess.id === voterId) {
          const newSess = { ...sess, track: updated.track, section: updated.section };
          localStorage.setItem(SESSION_KEY, JSON.stringify(newSess));
          setUser(newSess);
        }
      } catch {
        // ignore
      }
    }
    return updated;
  };

  const logout = (redirectUrl = "/login") => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingAuth: false,
        isLoadingPublicSettings: false,
        authChecked: true,
        authError: null,
        findAccount,
        loginWithPassword,
        setPasswordAndLogin,
        updateVoterInfo,
        logout,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};