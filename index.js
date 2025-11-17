require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
app.use(express.json());
app.use(cors());


const InitializeDbAndServer = async () => {
  try {
    await pool.query("SELECT 1");
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
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/add-mentor", async (req, res) => {
  try {
    const { username, name, phone, photo, expertise, experience, bio, linkedIn } = req.body;
    const insertQuery = `
      INSERT INTO mentor (username, name, phone, photo, expertise, experience, bio, linkedin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;
    await pool.query(insertQuery, [
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
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/coding-questions", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM coding_questions;`;
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/frontend-coding-questions", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM coding_questions;`;
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/add-coding-question", async (req, res) => {
  try {
    const { name, difficulty, link } = req.body;
    const insertQuery = `
      INSERT INTO coding_questions (name, difficulty, link)
      VALUES ($1, $2, $3);
    `;
    await pool.query(insertQuery, [name, difficulty, link]);

    res.status(201).send({
      message: "✅ Coding question added successfully",
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/jobs", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM jobs;`;
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/frontend-jobs", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM jobs;`;
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/add-jobs", async (req, res) => {
  try {
    const { id, company, role, link, ctc, description, technologies, location, last_date } = req.body;
    const sqlQuery = `
      INSERT INTO jobs (id, company, role, link, ctc, description, technologies, location, last_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `;
    await pool.query(sqlQuery, [
      id,
      company,
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
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.delete("/delete-jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sqlQuery = `DELETE FROM jobs WHERE id = $1;`;
    await pool.query(sqlQuery, [id]);
    res.json({ message: "Job deleted successfully", deletedId: id });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM users;`;
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


  app.post("/add-users", async (req, res) => {
  try {
    const { username, password, mentor_username } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkQuery = `SELECT * FROM users WHERE username = $1;`;
    const existingUser = await pool.query(checkQuery, [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).send({ message: "Username already exists" });
    }

    const sqlQuery1 = `
      INSERT INTO users (username, password, mentor_username)
      VALUES ($1, $2, $3)
      RETURNING username;
    `;
    const userInsert = await pool.query(sqlQuery1, [
      username,
      hashedPassword,
      mentor_username,
    ]);
    
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `;
    await pool.query(sqlQuery2, [
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

    res.status(201).send({
      message: "User Added Successfully.",
      userId: userInsert.rows[0].id,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const checkUserQuery = `SELECT * FROM users WHERE username = $1;`;
    const result = await pool.query(checkUserQuery, [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const passwordCheck = await bcrypt.compare(password, user.password);
    if (!passwordCheck) {
      return res.status(401).json({ message: "Invalid password" });
    }

    return res.status(200).json(username);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});


app.get("/user-details", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM user_details;`;
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/frontend-user-details", async (req, res) => {
  try {
    const { username } = req.body;

    const sqlQuery = `SELECT * FROM user_details WHERE username = $1;`;
    const result = await pool.query(sqlQuery, [username]);
    const row = result.rows[0];

    if (!row) {
      return res.status(404).json({ message: "User details not found" });
    }

    return res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/frontend-mentor-details", async (req, res) => {
  try {
    const { username } = req.body;

    const sqlQuery = `
  SELECT * FROM users 
  INNER JOIN mentor ON users.mentor_username = mentor.username 
  WHERE users.username = $1;
`;
const rowResult = await pool.query(sqlQuery, [username]);
const row = rowResult.rows[0];

    if (!row) {
      return res.status(404).json({ message: "Mentor not found for this user" });
    }

    return res.json(row);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/update-user-details", async (req, res) => {
  try {
    const { username, full_name, address, phone, photo, highest_study, college, graduation_year, expertise } = req.body;
    const sqlQuery = `
      UPDATE user_details
      SET full_name = $1, address = $2, phone = $3, photo = $4, highest_study = $5,
          college = $6, graduation_year = $7, expertise = $8
      WHERE username = $9;
    `;
    await pool.query(sqlQuery, [
      full_name,
      address,
      phone,
      photo,
      highest_study,
      college,
      graduation_year,
      expertise,
      username,
    ]);
    res.send({ message: "User Details Updated Successfully." });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/frontend-update-user-details", async (req, res) => {
  try {
    const { username, full_name, address, phone, photo, highest_study, college, graduation_year, expertise } = req.body;
    const sqlQuery = `
      UPDATE user_details
      SET full_name = $1, address = $2, phone = $3, photo = $4, highest_study = $5,
          college = $6, graduation_year = $7, expertise = $8
      WHERE username = $9;
    `;
    await pool.query(sqlQuery, [
      full_name,
      address,
      phone,
      photo,
      highest_study,
      college,
      graduation_year,
      expertise,
      username,
    ]);
    res.send({ message: "User Details Updated Successfully." });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/announcements", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM announcements;`;
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.get("/frontend-announcements", async (req, res) => {
  try {
    const sqlQuery = `SELECT * FROM announcements;`;
    const result = await pool.query(sqlQuery);
    res.send(result.rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.post("/add-announcements", async (req, res) => {
  try {
    const { id, title, description, date, duration, time, link } = req.body;
    const sqlQuery = `
      INSERT INTO announcements (id, title, description, date, duration, time, link)
      VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;
    await pool.query(sqlQuery, [id, title, description, date, duration, time, link]);
    res.status(201).send({ message: "Announcement Added Successfully." });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.delete("/delete-announcements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sqlQuery = `DELETE FROM announcements WHERE id = $1;`;
    await pool.query(sqlQuery, [id]);
    res.status(201).send({ message: "Announcement Deleted Successfully." });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});


InitializeDbAndServer();
