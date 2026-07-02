// Local storage data layer — replaces Base44 backend entirely.
// Exposes the same API shape (entities.X.filter/create/update/delete + auth.me + integrations.Core.UploadFile)
// so it's a drop-in replacement for @/api/base44Client.
//
// This module is the single data-layer entry point. When APP_CONFIG.mode
// is "live" it delegates to the MySQL/PHP backend (see src/lib/apiStore.js);
// otherwise it uses browser localStorage.

import { APP_CONFIG } from "@/config/appConfig";
import { apiStore } from "@/lib/apiStore";

const STORAGE_PREFIX = "election_db_";
const SESSION_KEY = "election_session";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

const read = (entity) => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + entity);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (entity, records) => {
  localStorage.setItem(STORAGE_PREFIX + entity, JSON.stringify(records));
};

const matches = (record, query) =>
  Object.entries(query).every(([key, val]) => record[key] === val);

const sortRecords = (records, sort) => {
  if (!sort) return records;
  let desc = false;
  let field = sort;
  if (sort.startsWith("-")) {
    desc = true;
    field = sort.slice(1);
  }
  return [...records].sort((a, b) => {
    let av = a[field];
    let bv = b[field];
    if (field === "created_date" || field === "updated_date") {
      av = av ? new Date(av).getTime() : 0;
      bv = bv ? new Date(bv).getTime() : 0;
    }
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
};

const buildEntity = (name) => ({
  list(sort, limit) {
    let records = read(name);
    records = sortRecords(records, sort);
    if (limit) records = records.slice(0, limit);
    return Promise.resolve(records);
  },
  filter(query, sort, limit) {
    let records = read(name).filter((r) => matches(r, query));
    records = sortRecords(records, sort);
    if (limit) records = records.slice(0, limit);
    return Promise.resolve(records);
  },
  get(id) {
    const record = read(name).find((r) => r.id === id);
    if (!record) return Promise.reject(new Error("Not found"));
    return Promise.resolve(record);
  },
  create(data) {
    const records = read(name);
    const now = new Date().toISOString();
    const record = {
      ...data,
      id: uid(),
      created_date: now,
      updated_date: now,
      created_by_id: null,
    };
    records.push(record);
    write(name, records);
    return Promise.resolve(record);
  },
  bulkCreate(items) {
    const records = read(name);
    const now = new Date().toISOString();
    const created = items.map((data) => ({
      ...data,
      id: uid(),
      created_date: now,
      updated_date: now,
      created_by_id: null,
    }));
    write(name, [...records, ...created]);
    return Promise.resolve(created);
  },
  update(id, updates) {
    const records = read(name);
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return Promise.reject(new Error("Not found"));
    records[idx] = {
      ...records[idx],
      ...updates,
      updated_date: new Date().toISOString(),
    };
    write(name, records);
    return Promise.resolve(records[idx]);
  },
  delete(id) {
    const records = read(name).filter((r) => r.id !== id);
    write(name, records);
    return Promise.resolve({ id });
  },
  deleteMany(query) {
    const remaining = read(name).filter((r) => !matches(r, query));
    write(name, remaining);
    return Promise.resolve({ success: true });
  },
  updateMany(query, operations) {
    const records = read(name);
    const setData = operations.$set || {};
    records.forEach((r) => {
      if (matches(r, query)) {
        Object.assign(r, setData, { updated_date: new Date().toISOString() });
      }
    });
    write(name, records);
    return Promise.resolve({ success: true });
  },
  bulkUpdate(items) {
    const records = read(name);
    items.forEach((item) => {
      const idx = records.findIndex((r) => r.id === item.id);
      if (idx !== -1) {
        records[idx] = {
          ...records[idx],
          ...item,
          updated_date: new Date().toISOString(),
        };
      }
    });
    write(name, records);
    return Promise.resolve(items);
  },
});

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const seedDefaultData = () => {
  if (read("Officer").length === 0) {
    const now = new Date().toISOString();
    write("Officer", [
      {
        id: uid(),
        user_id: "00-0001",
        name: "System Admin",
        email: "admin@iloilonhs.edu.ph",
        password: "admin123",
        password_changed: true,
        track: "",
        grade: "",
        section: "",
        role: "admin",
        election_id: null,
        created_date: now,
        updated_date: now,
        created_by_id: null,
      },
    ]);
  }
};

try {
  seedDefaultData();
} catch {
  // localStorage may not be available during SSR
}

const localBase44 = {
  entities: {
    Election: buildEntity("Election"),
    Voter: buildEntity("Voter"),
    Officer: buildEntity("Officer"),
    Candidate: buildEntity("Candidate"),
    Party: buildEntity("Party"),
    AuditLog: buildEntity("AuditLog"),
    Vote: buildEntity("Vote"),
  },
  auth: {
    me() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return Promise.resolve(raw ? JSON.parse(raw) : null);
      } catch {
        return Promise.resolve(null);
      }
    },
    isAuthenticated() {
      return Promise.resolve(!!localStorage.getItem(SESSION_KEY));
    },
    logout() {
      localStorage.removeItem(SESSION_KEY);
    },
    redirectToLogin() {
      window.location.href = "/login";
    },
    // Simulated Google sign-in (no real backend in this localStorage app).
    // Resolves with a pseudo Google profile for the given email so the login
    // flow can verify "the email exists in Google" without a real OAuth round-trip.
    async loginWithProvider(provider, fromUrl, email) {
      await new Promise((r) => setTimeout(r, 600));
      return {
        provider,
        email: email || "",
        verified: true,
        name: "",
      };
    },
    // Local-mode OTP: generates a code, stores it, and returns it as
    // `preview` so it can be shown on screen for testing. (In live mode
    // the PHP backend emails the code and returns no preview.)
    async requestOtp(email) {
      const len = APP_CONFIG.auth.otpLength || 8;
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < len; i++)
        code += chars[Math.floor(Math.random() * chars.length)];
      sessionStorage.setItem(
        "election_otp",
        JSON.stringify({
          email: (email || "").toLowerCase(),
          otp: code,
          ts: Date.now(),
        })
      );
      try {
        sessionStorage.setItem(
          "last_sent_email",
          JSON.stringify({
            to: email,
            subject: "Your One-Time Password — INHS Election System",
            body: `Your one-time password is: ${code}`,
            ts: Date.now(),
          })
        );
      } catch {
        // ignore
      }
      return { preview: code };
    },
    async verifyOtp(email, code) {
      try {
        const raw = sessionStorage.getItem("election_otp");
        if (!raw) return { valid: false };
        const data = JSON.parse(raw);
        const ttl = (APP_CONFIG.auth.otpTtlMinutes || 10) * 60000;
        if (data.email !== (email || "").toLowerCase()) return { valid: false };
        if (Date.now() - data.ts > ttl) return { valid: false };
        return { valid: data.otp === (code || "").trim() };
      } catch {
        return { valid: false };
      }
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const file_url = await readFileAsDataURL(file);
        return { file_url };
      },
      async GenerateImage({ prompt }) {
        return { url: `https://placehold.co/400x400/4F46E5/white?text=${encodeURIComponent(prompt.slice(0, 20))}` };
      },
      async InvokeLLM({ response_json_schema }) {
        return response_json_schema ? {} : "";
      },
      // Simulated email send (no real backend). Stores the message so the UI
      // can surface it for testing; in a real deployment this delivers via SMTP.
      async SendEmail({ to, subject, body }) {
        try {
          sessionStorage.setItem(
            "last_sent_email",
            JSON.stringify({ to, subject, body, ts: Date.now() })
          );
        } catch {
          // ignore
        }
        return { success: true };
      },
    },
  },
  analytics: {
    track() {
      return Promise.resolve();
    },
  },
};

// Switch between local (browser storage) and live (MySQL + PHP) backends
// based on the central config. All app imports resolve to this export.
export const base44 = APP_CONFIG.mode === "live" ? apiStore : localBase44;