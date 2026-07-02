// Live data layer — implements the same `base44` API shape as
// src/lib/localStore.js, but talks to the PHP + MySQL backend
// running on Xampp. Only used when APP_CONFIG.mode === "live".

import { APP_CONFIG } from "@/config/appConfig";

const BASE = (APP_CONFIG.api.baseUrl || "").replace(/\/$/, "");
const SESSION_KEY = "election_session";

const sessionUser = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const request = async (path, opts = {}) => {
  // Safety net: never let a stalled backend hang the UI forever.
  // (Uploads use their own fetch and are not affected.)
  const timeoutMs = opts.timeout ?? 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      signal: controller.signal,
      ...opts,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text };
    }
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The server took too long to respond. Check the PHP backend and Gmail SMTP settings.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

const buildEntity = (name) => ({
  list(sort, limit) {
    const q = new URLSearchParams();
    q.set("e", name);
    q.set("a", "list");
    if (sort) q.set("sort", sort);
    if (limit) q.set("limit", limit);
    return request(`?${q.toString()}`);
  },
  filter(query, sort, limit) {
    return request(`?e=${name}&a=filter`, {
      method: "POST",
      body: JSON.stringify({ query, sort, limit }),
    });
  },
  get(id) {
    return request(`?e=${name}&a=get&id=${encodeURIComponent(id)}`);
  },
  create(data) {
    return request(`?e=${name}&a=create`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  bulkCreate(items) {
    return request(`?e=${name}&a=bulkCreate`, {
      method: "POST",
      body: JSON.stringify(items),
    });
  },
  update(id, updates) {
    return request(`?e=${name}&a=update`, {
      method: "POST",
      body: JSON.stringify({ id, updates }),
    });
  },
  bulkUpdate(items) {
    return request(`?e=${name}&a=bulkUpdate`, {
      method: "POST",
      body: JSON.stringify(items),
    });
  },
  updateMany(query, operations) {
    return request(`?e=${name}&a=updateMany`, {
      method: "POST",
      body: JSON.stringify({ query, operations }),
    });
  },
  delete(id) {
    return request(`?e=${name}&a=delete`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  },
  deleteMany(query) {
    return request(`?e=${name}&a=deleteMany`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },
});

export const apiStore = {
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
      return Promise.resolve(sessionUser());
    },
    isAuthenticated() {
      return Promise.resolve(!!sessionUser());
    },
    logout() {
      localStorage.removeItem(SESSION_KEY);
      return Promise.resolve();
    },
    redirectToLogin() {
      window.location.href = "/login";
    },
    // Simulated Google sign-in (the frontend confirms the email; the
    // real Google account verification happens out-of-band). Matches
    // the local store behaviour.
    async loginWithProvider(provider, fromUrl, email) {
      await new Promise((r) => setTimeout(r, 600));
      return { provider, email: email || "", verified: true, name: "" };
    },
    // Asks the PHP backend to generate + email an OTP via Gmail.
    // No code is returned to the client (email-only delivery).
    requestOtp(email) {
      return request(`?e=auth&a=request-otp`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    verifyOtp(email, code) {
      return request(`?e=auth&a=verify-otp`, {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`${BASE}?e=file&a=upload`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Upload failed");
        return { file_url: data.file_url };
      },
      async GenerateImage() {
        return { url: `${BASE}?e=file&a=placeholder` };
      },
      async InvokeLLM({ response_json_schema }) {
        return response_json_schema ? {} : "";
      },
      async SendEmail() {
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