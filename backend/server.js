import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "./Supabase.js";

const app = express();

/* Needed for ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* this makes dashboard.html work without Live Server */
app.use(express.static(path.join(__dirname, "..")));

app.use(express.json());

/* This is supabase routes*/
/*Get club info */
app.get("/clubs", async (req, res) => {
    const { data, error } = await supabase
        .from("clubs")
        .select("*")
        .order("name", { ascending: true });

    if (error) return res.status(500).json(error);

    res.json(data);
});

/*Get event info */
app.get("/events", async (req, res) => {
    const { data, error } = await supabase
        .from("events")
        .select("*");

    if (error) return res.status(500).json(error);

    res.json(data);
});

/*Create event */
app.post("/events", async (req, res) => {
    const {
        name,
        date,
        time,
        clubId,
        location,
        description,
        practicalInformation,
        isPublished
    } = req.body;

    if (!name || !date || !time || !clubId || !location || !description) {
        return res.status(400).json({
            error: "Missing required event fields."
        });
    }

    const { data, error } = await supabase
        .from("events")
        .insert([{
            title: name, //this maps frontend "name" to database "title" coulmn
            date,
            time,
            clubId: Number(clubId),
            location,
            description,
            practicalInfo,
            isPublished: Boolean(isPublished)
        }])
        .select()
        .single();

    if (error) return res.status(500).json(error);

    res.status(201).json(data);
});

/*Get the number of current joined members */
app.get("/clubs/:id", async (req, res) => {
    const clubId = req.params.id;

    const { data, error } = await supabase 
        .from("clubs")
        .select("*")
        .eq("id", clubId)
        .single();

    if (error) {
        return res.status(500).json(error);
    }

    res.json(data)
});

/* Update the database with new number of members in the club*/
app.post("/clubs/:id/joined", async (req, res) => {
    const clubId = req.params.id;

    const { data } = await supabase
        .from("clubs")
        .select("joined")
        .eq("id", clubId)
        .single();
    const newCount = (data.joined || 0) + 1;

    await supabase  
        .from("clubs")
        .update({ joined: newCount })
        .eq("id", clubId);

    res.json({ joined: newCount});

});



/* Start server */
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});