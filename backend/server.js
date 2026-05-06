import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "./Supabase.js";
import session from "express-session";
import { randomUUID } from "crypto"; //generates random id
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const supabaseAdmin = createClient(
    "https://sjtapuesjqubmdawxwzm.supabase.co",
    process.env.SUPABASE_SERVICE_KEY
);


app.use(express.json());

/* Needed for ES modules so fx senfFile works*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/*This allows espress to remember user logins acros requests using req.session */
app.use(session({
    secret: "your-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.get("/api/me", (req, res) => {
    if (!req.session.user) {
        return res.json({ role: null });
    }

    res.json({ role: req.session.user.role });
});

/*This sets login page as our default homepage */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

/* this enabels express to acces the fiels in our public folder directly in the browser */
app.use(express.static(path.join(__dirname, "..", "public")));

/*This function checks the users role  */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user) { //user is not logged in
      return res.status(401).send("Not logged in");
    }

    if (req.session.user.role !== role) { //loged in but has wrong role 
      return res.status(403).send("Not allowed");
    }

    next(); // allowes as has correct role
  };
}

// === This is log in and log out ===//
/*Here we generate a random user id when user logs in and saves it in the database  */
app.post("/login-demo", async(req, res) => {
    const userId = randomUUID();

       req.session.user = {
        id: userId,
        role: req.body.role
    };
    
    //save user in database
    await supabase.from("users").insert([
        {
            id: userId,
            role: req.body.role
        }
    ]);

    res.sendStatus(200);
});

/*When we log out the session is destroyed */
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send("Logout failed");
    }

    res.clearCookie("connect.sid");
    res.sendStatus(200);
  });
});

// === This is for our pages ==//
app.get("/student/:page", requireRole("student"), (req, res) => { // here we check if the role is a student
  res.sendFile(
    path.join(__dirname, "..", "public", "student", `${req.params.page}.html`)
  );
});

app.get("/owner/:page", requireRole("club_owner"), (req, res) => { //check role = club owner
  res.sendFile(
    path.join(__dirname, "..", "public", "owner", `${req.params.page}.html`)
  );
});

// == This is supabase routes ==//

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
        .select(`
            *,
            clubs(color)
        `);

    if (error) return res.status(500).json(error);

    res.json(data);
});

/*Create event */
app.post("/events", async (req, res) => {
    const {
        name,
        date,
        timeStart,
        timeEnd,
        clubId,
        location,
        description,
        practicalInformation,
        isPublished
    } = req.body;

    if (!name || !date || !timeStart || !timeEnd || !clubId || !location || !description) {
        return res.status(400).json({
            error: "Missing required event fields."
        });
    }

    // combine time in backend
    const time = `${timeStart} - ${timeEnd}`
    
    const { data, error } = await supabase
        .from("events")
        .insert([{
            title: name, //this maps frontend "name" to database "title" coulmn
            date,
            time,
            clubId: Number(clubId),
            location,
            description,
            practicalInfo: practicalInformation, 
            isPublished: Boolean(isPublished)
        }])
        .select()
        .single();

    if (error) return res.status(500).json(error);

    res.status(201).json(data);
});

/* Get current number of joined users for an event */
app.get("/events/:id/join-count", async (req, res) => {
    const eventId = req.params.id;

    const { count, error } = await supabase
        .from("event_joined")
        .select("*", { count: "exact", head: true}) //count the rows 
        .eq("event_id", eventId)

    if(error){
        return res.status(500).json(error);
    } 

    res.json({ joined: count });
});

/* Increment joined count for an event */
app.post("/events/:id/joined", async (req, res) => {
    const userId = req.session.user?.id;
    const eventId = req.params.id;

    if(!userId){
        return  res.status(401).send("Not logged in");
    }

    const { error } = await supabase
        .from("event_joined")
        .insert([
            {
                user_id: userId,
                event_id: eventId
            }
        ]);

    //get the updated count of joined
    const { count, error: countError } = await supabase 
        .from("event_joined")
        .select("*", {count: "exact", head: true}) //count the rows
        .eq("event_id", eventId)
    
    if (countError) {
        return res.status(500).json(countError);
    }

    res.json({ 
        joined: count
    });
});

/*Get the number of current joined members in a club*/
app.get("/clubs/:id/join-count", async (req, res) => {
    const clubId = req.params.id;

    const { count, error } = await supabase 
        .from("club_members")
        .select("*", {count: "exact", head: true}) //count the rows
        .eq("club_id", clubId)

    if (error) {
        return res.status(500).json(error);
    }

    res.json({ joined: count});
});

/* Update the database with new number of members in the club*/
app.post("/clubs/:id/joined", async (req, res) => {
    const userId = req.session.user?.id;
    const clubId = req.params.id;

    if(!userId){
        return res.status(401).send("Not logged in");
    }

    const { error } = await supabase
        .from("club_members")
        .insert([
            {
                user_id: userId,
                club_id: clubId
            }
        ]);

    if(error){
        return res.status(400).json({
            message: "you alredy joined this club"
        });
    }

    //get the updated count of joined
    const { count, error: counterror } = await supabase 
        .from("club_members")
        .select("*", {count: "exact", head: true}) //count the rows
        .eq("club_id", clubId)
    
    if (counterror) {
        return res.status(500).json(countError);
    }

    res.json({ 
        message: "Joined successfully",
        joined: count
    });
});

/*Create a new club (student application) */
app.post("/clubs", async (req, res) => {
    const { name, category, contactEmail, phone } = req.body;

    if (!name || !category) {
        return res.status(400).json({ error: "Name and category are required." });
    }

    // Get the current max id to assign the next one
    const { data: maxData, error: maxError } = await supabase
        .from("clubs")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .single();

    if (maxError && maxError.code !== "PGRST116") {
        return res.status(500).json(maxError);
    }

    const nextId = maxData ? maxData.id + 1 : 1;
    const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);

    const { data, error } = await supabase
        .from("clubs")
        .insert([{
            id: nextId,
            name,
            category: capitalizedCategory,
            contactEmail: contactEmail || null,
            phone: phone || null
        }])
        .select()
        .single();

    if (error) return res.status(500).json(error);

    res.status(201).json(data);
});

/*Update club details */
app.patch("/clubs/:id", async (req, res) => {
    const clubId = req.params.id;
    const { regularDate, regularTime, regularPlace, description, contactEmail, phone, color } = req.body;

    // Check colour uniqueness if a colour is being set
    if (color) {
        const { data: existing } = await supabase
            .from("clubs")
            .select("id, color")
            .eq("color", color)
            .neq("id", clubId)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ error: "This colour is already taken by another club." });
        }
    }

    const updates = {};
    if (regularDate !== undefined) updates.regularDate = regularDate;
    if (regularTime !== undefined) updates.regularTime = regularTime;
    if (regularPlace !== undefined) updates.regularPlace = regularPlace;
    if (description !== undefined) updates.description = description;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail;
    if (phone !== undefined) updates.phone = phone;
    if (color !== undefined) updates.color = color;

    const { data, error } = await supabase
        .from("clubs")
        .update(updates)
        .eq("id", clubId)
        .select()
        .single();

    if (error) return res.status(500).json(error);

    res.json(data);
});

/*Upload club image to Supabase Storage */
app.post("/clubs/:id/image", upload.single("image"), async (req, res) => {
    const clubId = req.params.id;

    if (!req.file) {
        return res.status(400).json({ error: "No image file provided." });
    }

    const ext = req.file.originalname.split(".").pop();
    const filePath = `${clubId}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
        .from("club-images")
        .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
        });

    if (uploadError) return res.status(500).json(uploadError);

    const { data: urlData } = supabaseAdmin.storage
        .from("club-images")
        .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const { data, error } = await supabase
        .from("clubs")
        .update({ image: publicUrl })
        .eq("id", clubId)
        .select()
        .single();

    if (error) return res.status(500).json(error);

    res.json({ image: publicUrl, club: data });
});

/*Update event details */
app.patch("/events/:id", async (req, res) => {
    const eventId = req.params.id;
    const { timeStart, timeEnd, title, date, location, description, practicalInfo } = req.body;

    if (!timeStart || !timeEnd) {
        return res.status(400).json({ error: "timeStart and timeEnd are required." });
    }

    const updates = { time: `${timeStart} - ${timeEnd}` };
    if (title !== undefined) updates.title = title;
    if (date !== undefined) updates.date = date;
    if (location !== undefined) updates.location = location;
    if (description !== undefined) updates.description = description;
    if (practicalInfo !== undefined) updates.practicalInfo = practicalInfo;

    const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", eventId)
        .select()
        .single();

    if (error) return res.status(500).json(error);

    res.json(data);
});

/* Start server */
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});