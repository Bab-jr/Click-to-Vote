// ============================================================
// CENTRALIZED APPLICATION CONFIG
// ------------------------------------------------------------
// Edit this ONE file to switch between local (browser storage)
// and live (Xampp MySQL + Apache PHP + Gmail SMTP) mode, and to
// change the server credentials / academic structure used across
// the whole system.
// ============================================================

export const APP_CONFIG = {
  // ----------------------------------------------------------
  // RUN MODE
  //   "local" -> runs entirely in the browser (localStorage).
  //              No backend needed. Works in the Base44 preview.
  //   "live"  -> talks to your Xampp MySQL + PHP API for real
  //              data persistence and real Gmail OTP emails.
  //              Requires the /server backend running on Xampp.
  // ----------------------------------------------------------
  mode: "live",

  // Base URL of the PHP API (the api.php file inside /server).
  // Run cloudflared tunnel --url http://localhost:80 in cmd and copy the URL it gives you here. Make sure to include the /inhs-election/api.php part.
  api: {
    baseUrl: "https://taste-vista-brisbane-daniel.trycloudflare.com/inhs-election/api.php",
  },

  // Database credentials — must match the values in /server/config.php
  // and the database you create from /database/schema.sql.
  database: {
    host: "localhost",
    name: "inhs_election",
    user: "root",
    password: "",
  },

  // Gmail account used to send one-time passwords.
  // Use a Google "App Password" (16 chars), NOT your normal Gmail
  // password. Enable 2-Step Verification, then create an App Password
  // at https://myaccount.google.com/apppasswords
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    username: "admin@iloilonhs.edu.ph",
    password: "302509@admin",
    fromName: "INHS Election System",
    fromEmail: "admin@iloilonhs.edu.ph",
  },

  auth: {
    otpLength: 8, // length of generated one-time passwords
    otpTtlMinutes: 10, // how long an OTP stays valid
  },
};

// ============================================================
// ACADEMIC STRUCTURE
// ------------------------------------------------------------
// Single source of truth for clusters, grade levels, tracks and
// sections. Edit these arrays to match the school's official
// lists. (src/lib/trackConfig.js re-exports them.)
// ============================================================

export const CLUSTERS = ["Academic", "Techpro"];

export const GRADES = ["Grade 11", "Grade 12"];

// Tracks available per grade level. Some tracks are offered to both grades.
export const TRACKS_BY_GRADE = {
  "Grade 11": [
    "Sports, Wellness and Health",
    "Creative Arts and Design Technologies",
    "Hospitality and Tourism",
    "ICT Support and Computer Programming",
    "ASSH",
    "B.E",
    "BioMed",
    "Engineering",
  ],
  "Grade 12": [
    "ICT",
    "H.E",
    "ASSH",
    "B.E",
    "BioMed",
    "Engineering",
  ],
};

// Union of all tracks (used for filters/dropdowns that are not grade-specific).
export const TRACKS = Array.from(
  new Set([...TRACKS_BY_GRADE["Grade 11"], ...TRACKS_BY_GRADE["Grade 12"]])
);

// Sections are not yet confirmed — left empty until an official list is
// provided. Add entries like { "Grade 11": ["A", "B", "C"] } when ready.
export const SECTIONS_PER_GRADE = {
  "Grade 11": [
    "Sapientia",
    "Scientia",
    "Excellentia",
    "Constantia",
    "Gravitas",
    "Dignitas",
    "Fidelitas",
    "Integretas",
    "Benevolentia",
    "Competentia",
    "Prudentia",
    "Reverentia",
    "Veritas",
    "Caritas",
    "Fides",
    "Virtus",
    "Justitia",
    "Libertas",
    "Humanitas",
    "Pax",
    "Probitas",
    "Progressus",
    "Clemetia",
    "Gratia",
    "Pietas",
    "Innovatio",
    "Voluntas",
    "Felicitas",
    "Amicitia"
  ],

  "Grade 12": [
    "Mendel",
    "Darwin",
    "Franklin",
    "Leeuwenhoek",
    "Alcala",
    "del Mundo",
    "Benz",
    "Curie",
    "Faraday",
    "Smeaton",
    "Constantino",
    "David",
    "Kalaw",
    "Caballero",
    "Jocano",
    "Enriquez"
  ]
};

export function getTracksForGrade(grade) {
  return TRACKS_BY_GRADE[grade] || [];
}

export function getSectionsForGrade(grade) {
  return SECTIONS_PER_GRADE[grade] || [];
}