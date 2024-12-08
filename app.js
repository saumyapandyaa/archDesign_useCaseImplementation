const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const session = require("express-session");
const multer = require("multer");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Constants for user roles
const ROLES = { STUDENT: "student", LECTURER: "lecturer", ADMIN: "admin" };

// Session Setup
app.use(
    session({
        secret: "yourSecretKey",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day expiration
    })
);

// Database Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "sqlroot",
    database: "phase3"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.stack);
        return;
    }
    console.log("Database connected");
});

// Routes
app.get("/", (req, res) => {
    res.render("index");
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).send("Internal server error");
        }

        if (results.length > 0 && password === results[0].password) {
            req.session.user = { id: results[0].id, role: results[0].role }; // Save user info in session
            res.redirect("/dashboard");
        } else {
            res.status(401).send("Invalid credentials");
        }
    });
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect("/");

    const { id, role } = req.session.user;

    if (role === ROLES.LECTURER) {
        db.query("SELECT * FROM courses WHERE lecturer_id = ?", [id], (err, courses) => {
            if (err) throw err;
            res.render("dashboard", { user: req.session.user, courses });
        });
    } else if (role === ROLES.STUDENT) {
        db.query("SELECT * FROM courses", (err, courses) => {
            if (err) throw err;
            res.render("dashboard", { user: req.session.user, courses });
        });
    } else if (role === ROLES.ADMIN) {
        db.query("SELECT * FROM courses", (err, courses) => {
            if (err) throw err;
            db.query("SELECT * FROM users", (err, users) => {
                if (err) throw err;
                res.render("dashboard", { user: req.session.user, courses, users });
            });
        });
    } else {
        res.status(403).send("Access denied");
    }
});

app.get("/password-reset", (req, res) => {
    res.render("password-reset");
});

app.post("/password-reset", (req, res) => {
    const { email } = req.body;

    db.query("SELECT * FROM users WHERE username = ?", [email], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            const resetToken = Math.random().toString(36).substring(2);
            db.query("UPDATE users SET password_reset_token = ? WHERE id = ?", [resetToken, results[0].id], (err) => {
                if (err) throw err;

                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "your-email@gmail.com",
                        pass: "your-email-password"
                    }
                });

                const mailOptions = {
                    from: "your-email@gmail.com",
                    to: email,
                    subject: "Password Reset Request",
                    text: `Reset your password: http://localhost:3000/reset-password/${resetToken}`
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) throw err;
                    res.send("Password reset email sent!");
                });
            });
        } else {
            res.send("User not found");
        }
    });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "public/uploads")),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage: storage });

app.get("/lecturer/upload-material", (req, res) => {
    if (!req.session.user || req.session.user.role !== ROLES.LECTURER) {
        return res.redirect("/dashboard"); // Redirect unauthorized users
    }

    // Hardcoded list of files (mimicking uploaded files)
    const files = [
        { id: 1, name: "Lecture1.pdf", size: "2 MB", uploadedBy: "Prof. Smith", date: "2024-12-01" },
        { id: 2, name: "Assignment1.docx", size: "1 MB", uploadedBy: "Prof. Smith", date: "2024-12-02" },
        { id: 3, name: "Syllabus.pdf", size: "500 KB", uploadedBy: "Prof. Smith", date: "2024-12-03" },
    ];

    res.render("upload-material", { files });
});


app.post('/lecturer/upload-material', upload.single('file'), (req, res) => {
    const { courseId } = req.body;
    if (!req.file) return res.status(400).send("No file uploaded");
    const filePath = req.file.path; // Save this path in the database
    const query = 'INSERT INTO materials (course_id, file_path) VALUES (?, ?)';
    db.query(query, [courseId, filePath], (err) => {
        if (err) {
            console.error('Error uploading material:', err);
            return res.status(500).send('Error uploading material.');
        }
        res.redirect('/dashboard');
    });
});


app.post('/admin/add-user', (req, res) => {
    const { username, password, role } = req.body;
    const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    db.query(query, [username, password, role], (err) => {
        if (err) {
            console.error('Error adding user:', err);
            return res.status(500).send('Error adding user.');
        }
        res.redirect('/admin/manage-users');
    });
});

app.get('/admin/manage-users', (req, res) => {
    const query = 'SELECT * FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).send('Error fetching users.');
        }
        res.render('manage-users', { users: results });
    });
});

app.post('/admin/delete-user', (req, res) => {
    const { userId } = req.body;
    const query = 'DELETE FROM users WHERE id = ?';
    db.query(query, [userId], (err) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).send('Error deleting user.');
        }
        res.redirect('/admin/manage-users');
    });
});

app.get('/student/courses', (req, res) => {
    const query = 'SELECT * FROM courses';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching courses:', err);
            return res.status(500).send('Error fetching courses.');
        }
        res.render('student-courses', { courses: results });
    });
});

app.post('/lecturer/upload-material', upload.single('file'), (req, res) => {
    const { courseId } = req.body;
    const filePath = req.file.path; // Save this path in the database
    const query = 'INSERT INTO materials (course_id, file_path) VALUES (?, ?)';
    db.query(query, [courseId, filePath], (err) => {
        if (err) {
            console.error('Error uploading material:', err);
            return res.status(500).send('Error uploading material.');
        }
        res.redirect('/dashboard');
    });
});




app.use((req, res) => res.status(404).send("Page not found"));

app.listen(3000, () => console.log("Server running on port 3000"));
