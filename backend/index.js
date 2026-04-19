// ================= LOAD ENV =================
require("dotenv").config();

// ================= IMPORTS =================
const express = require("express");
const mysql   = require("mysql2");
const cors    = require("cors");

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= ENV DEBUG =================
console.log("===============================");
console.log("  Job Tracker Backend Starting");
console.log("===============================");
console.log("ENV CHECK:");
console.log("  MYSQLHOST     =", process.env.MYSQLHOST     || "❌ MISSING");
console.log("  MYSQLPORT     =", process.env.MYSQLPORT     || "❌ MISSING");
console.log("  MYSQLUSER     =", process.env.MYSQLUSER     || "❌ MISSING");
console.log("  MYSQLDATABASE =", process.env.MYSQLDATABASE || "❌ MISSING");
console.log("  MYSQLPASSWORD =", process.env.MYSQLPASSWORD ? "✅ SET" : "❌ MISSING");
console.log("===============================");

// ================= DB CONNECTION =================
// ================= DB CONNECTION =================
let db;

function connectDB() {
    db = mysql.createConnection({
        host:     process.env.MYSQLHOST,
        user:     process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port:     Number(process.env.MYSQLPORT) || 3306,
    });

    db.connect((err) => {
        if (err) {
            console.log("❌ DB Connection Failed:", err.message);
            console.log("   Retrying in 5 seconds...");
            setTimeout(connectDB, 5000); // retry after 5 seconds
        } else {
            console.log("✅ Connected to Railway MySQL Database!");

            // Auto-create table
            const createTable = `
                CREATE TABLE IF NOT EXISTS applications (
                    id            INT AUTO_INCREMENT PRIMARY KEY,
                    company       VARCHAR(255) NOT NULL,
                    role          VARCHAR(255) NOT NULL,
                    status        VARCHAR(100) DEFAULT 'Applied',
                    applied_date  DATE,
                    response_days INT DEFAULT 0,
                    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            db.query(createTable, (err) => {
                if (err) console.log("❌ Table creation failed:", err.message);
                else console.log("✅ Table 'applications' is ready!");
            });
        }
    });

    // ← THIS IS THE KEY FIX — auto reconnect on disconnect!
    db.on("error", (err) => {
        console.log("⚠️ DB Error:", err.message);
        if (err.code === "ECONNRESET" || 
            err.code === "PROTOCOL_CONNECTION_LOST" ||
            err.fatal) {
            console.log("🔄 Reconnecting to database...");
            connectDB(); // reconnect automatically!
        } else {
            throw err;
        }
    });
}

// Start connection
connectDB();

// ================= ROUTES =================

// Home — test if server is running
app.get("/", (req, res) => {
    res.json({
        message: "✅ Job Tracker API is running!",
        status:  "OK",
        version: "1.0.0",
    });
});

// ── GET ALL JOBS ──────────────────────────────────────────────
app.get("/jobs", (req, res) => {
    db.query("SELECT * FROM applications ORDER BY id DESC", (err, result) => {
        if (err) {
            console.log("❌ GET /jobs Error:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: result });
    });
});

// ── ADD JOB ───────────────────────────────────────────────────
app.post("/add-job", (req, res) => {
    const { company, role, status, applied_date, response_days } = req.body;

    // Validation
    if (!company || !role) {
        return res.status(400).json({
            success: false,
            message: "Company and Role are required fields!"
        });
    }

    const sql = `
        INSERT INTO applications (company, role, status, applied_date, response_days)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [company, role, status || "Applied", applied_date || null, response_days || 0],
        (err, result) => {
            if (err) {
                console.log("❌ POST /add-job Error:", err.message);
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({
                success: true,
                message: "Job added successfully ✅",
                id:      result.insertId,
            });
        }
    );
});

// ── UPDATE JOB ────────────────────────────────────────────────
app.put("/update-job/:id", (req, res) => {
    const { id } = req.params;
    const { company, role, status, applied_date, response_days } = req.body;

    const sql = `
        UPDATE applications
        SET company=?, role=?, status=?, applied_date=?, response_days=?
        WHERE id=?
    `;

    db.query(
        sql,
        [company, role, status, applied_date, response_days, id],
        (err) => {
            if (err) {
                console.log("❌ PUT /update-job Error:", err.message);
                return res.status(500).json({ success: false, message: err.message });
            }
            res.json({ success: true, message: "Job updated successfully ✅" });
        }
    );
});

// ── DELETE JOB ────────────────────────────────────────────────
app.delete("/delete-job/:id", (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM applications WHERE id=?", [id], (err) => {
        if (err) {
            console.log("❌ DELETE /delete-job Error:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: "Job deleted successfully 🗑️" });
    });
});

// ── STATS (Bonus route — useful for dashboard) ────────────────
app.get("/stats", (req, res) => {
    const sql = `
        SELECT
            COUNT(*) AS total,
            SUM(status = 'Applied')    AS applied,
            SUM(status = 'Interview')  AS interview,
            SUM(status = 'Offered')    AS offered,
            SUM(status = 'Rejected')   AS rejected
        FROM applications
    `;
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: result[0] });
    });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Test it: http://localhost:${PORT}/jobs`);
});