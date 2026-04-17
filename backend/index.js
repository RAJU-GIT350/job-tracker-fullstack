require("dotenv").config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= DB CONNECTION =================
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
});
db.connect((err) => {
    if (err) {
        console.log("❌ DB Connection Failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL Database (Job Tracker)");
});

// ================= HOME =================
app.get('/', (req, res) => {
    res.json({ message: "Job Tracker API is running 🚀" });
});

// ================= ADD JOB (with duplicate check like your old code) =================
app.post('/add-job', (req, res) => {

    const { company, role, status, applied_date, response_days } = req.body;

    const checkSql = `
        SELECT * FROM applications 
        WHERE company=? AND role=? AND applied_date=?
    `;

    db.query(checkSql, [company, role, applied_date], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Error checking duplicate ❌"
            });
        }

        if (result.length > 0) {
            return res.json({
                success: false,
                message: "Duplicate entry not allowed ⚠️"
            });
        }

        const insertSql = `
            INSERT INTO applications (company, role, status, applied_date, response_days)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(insertSql, [company, role, status, applied_date, response_days], (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Insert failed ❌"
                });
            }

            res.status(201).json({
                success: true,
                message: "Job added successfully ✅",
                insertedId: result.insertId
            });
        });
    });
});

// ================= GET ALL JOBS =================
app.get('/jobs', (req, res) => {

    db.query("SELECT * FROM applications ORDER BY id DESC", (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Fetch failed ❌"
            });
        }

        res.json({
            success: true,
            count: result.length,
            data: result
        });
    });
});

// ================= GET SINGLE JOB =================
app.get('/job/:id', (req, res) => {

    const { id } = req.params;

    db.query("SELECT * FROM applications WHERE id=?", [id], (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database error ❌"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job not found ❌"
            });
        }

        res.json({
            success: true,
            data: result[0]
        });
    });
});

// ================= UPDATE JOB =================
app.put('/update-job/:id', (req, res) => {

    const { id } = req.params;
    const { company, role, status, applied_date, response_days } = req.body;

    const sql = `
        UPDATE applications 
        SET company=?, role=?, status=?, applied_date=?, response_days=?
        WHERE id=?
    `;

    db.query(sql, [company, role, status, applied_date, response_days, id], (err) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Update failed ❌"
            });
        }

        res.json({
            success: true,
            message: "Job updated successfully ✅"
        });
    });
});

// ================= DELETE JOB =================
app.delete('/delete-job/:id', (req, res) => {

    const { id } = req.params;

    db.query("DELETE FROM applications WHERE id=?", [id], (err) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Delete failed ❌"
            });
        }

        res.json({
            success: true,
            message: "Job deleted successfully 🗑️"
        });
    });
});

// ================= START SERVER =================
app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});