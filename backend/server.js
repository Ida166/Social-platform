import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "./supabase.js";

const app = express();

/* Needed for ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

/* ---------------- SUPABASE ROUTES ---------------- */

app.get("/clubs", async (req, res) => {
    const { data, error } = await supabase
        .from("clubs")
        .select("*");

    if (error) return res.status(500).json(error);

    res.json(data);
});

app.get("/events", async (req, res) => {
    const { data, error } = await supabase
        .from("events")
        .select("*");

    if (error) return res.status(500).json(error);

    res.json(data);
});

/* ---------------- SERVE FRONTEND FILES ---------------- */

/* this makes dashboard.html work without Live Server */
app.use(express.static(path.join(__dirname, "..")));

/* START SERVER */
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});