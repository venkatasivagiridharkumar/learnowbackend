// index.js
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const cors=require("cors");

const app = express();
app.use(express.json());
app.use(cors());
const dbPath = path.join(__dirname, "learnow.db");
let db = null;

const InitializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.log({ message: err.message });
    process.exit(1);
  }
};

app.get("/mentors-details", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM mentor;`;
    const mentorDetails = await db.all(sqlQuery);
    res.send(mentorDetails);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/add-mentor", async (req, res) => {
  try {
    const { username, name, phone, photo, expertise, experience, bio, linkedIn } = req.body;
    const insertQuery = `
      INSERT INTO mentor (username, name, phone, photo, expertise, experience, bio, linkedin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const result = await db.run(insertQuery, [
      username,
      name,
      phone,
      photo,
      expertise,
      experience,
      bio,
      linkedIn,
    ]);

    res.status(201).send({
      message: "Mentor added successfully",
      mentorId: result.lastID,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


app.get("/coding-questions", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM coding_questions;`;
    const data = await db.all(sqlQuery);
    res.send(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/add-coding-question", async (req, res) => {
  try {
    const { name, difficulty, link } = req.body;
    const insertQuery = `
      INSERT INTO coding_questions (name, difficulty, link)
      VALUES (?, ?, ?);
    `;
    const result = await db.run(insertQuery, [name, difficulty, link]);

    res.status(201).send({
      message: "✅ Coding question added successfully",
      questionId: result.lastID,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


app.get("/jobs", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM jobs;`;
    const data = await db.all(sqlQuery);
    res.send(data);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/add-jobs", async (req, res) => {
  try {
    const { id,company, role, link, ctc, description, technologies, location, last_date } = req.body;
    const sqlQuery = `
      INSERT INTO jobs (id,company, role, link, ctc, description, technologies, location, last_date)
      VALUES (?,?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const response = await db.run(sqlQuery, [
      id,company,
      role,
      link,
      ctc,
      description,
      technologies,
      location,
      last_date,
    ]);

    res.status(201).json({
      message: "Job added successfully",
      id: response.lastID,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.delete("/delete-jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sqlQuery = `DELETE FROM jobs WHERE id = ?;`;
    await db.run(sqlQuery, [id]);
    res.json({ message: "Job deleted successfully", deletedId: id });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


app.get("/users", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM user;`;
    const response = await db.all(sqlQuery);
    res.send(response);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/add-users", async (req, res) => {
  try {
    const { username, password, mentor_username } = req.body;
    const checkQuery = `SELECT * FROM user WHERE username = ?;`;
    const existingUser = await db.get(checkQuery, [username]);
    if (existingUser) {
      return res.status(400).send({ message: "Username already exists" });
    }

    const sqlQuery1 = `INSERT INTO user (username, password, mentor_username) VALUES (?, ?, ?);`;
    const userInsert = await db.run(sqlQuery1, [username, password, mentor_username]);

    const {
      full_name = "",
      address = "",
      phone = "",
      photo = "https://www.pngall.com/wp-content/uploads/12/Avatar-PNG-Images-HD.png",
      highest_study = "",
      college = "",
      graduation_year = 2026,
      expertise = "",
    } = req.body;

    const sqlQuery2 = `
      INSERT INTO user_details (username, full_name, address, phone, photo, highest_study, college, graduation_year, expertise)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const response = await db.run(sqlQuery2, [
      username,
      full_name,
      address,
      phone,
      photo,
      highest_study,
      college,
      graduation_year,
      expertise,
    ]);

    res.status(201).send({ message: "User Added Successfully.", userId: userInsert.lastID });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


app.get("/user-details", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM user_details;`;
    const response = await db.all(sqlQuery);
    res.send(response);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/update-user-details", async (req, res) => {
  try {
    const { username, full_name, address, phone, photo, highest_study, college, graduation_year, expertise } = req.body;
    const sqlQuery = `
      UPDATE user_details
      SET full_name = ?, address = ?, phone = ?, photo = ?, highest_study = ?, college = ?, graduation_year = ?, expertise = ?
      WHERE username = ?;
    `;
    await db.run(sqlQuery, [full_name, address, phone, photo, highest_study, college, graduation_year, expertise, username]);
    res.send({ message: "User Details Updated Successfully." });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

InitializeDbAndServer();
