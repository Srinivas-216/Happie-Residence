const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true
}));

// Middleware
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/user', { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// User Schema & Model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true }, 
    phonenumber:{type:String, required:true},
    address:{type:String, required:true},
    city:{type:String, required:true},
    state:{type:String, required:true},
    country:{type:String, required:true},
    zipcode:{type:String, required:true},
    password: { type: String, required: true }

});

const User = mongoose.model('users', userSchema);

// Render Login Page
app.get('/login', (req, res) => {
    
    res.render('login');
});

// Render Home Page
app.get('/mainhome', (req, res) => {
   if (!req.session.user) {
        return res.redirect("/login");
    }
    
    /*res.send(`<h1>Welcome, ${req.session.user.email}</h1> <a href='/logout'>Logout</a>`);*/
    res.render('mainhome',{"Name":req.session.user.name});

    
    /*res.render('mainhome');*/
});

app.get('/profile',(req,res)=>{
    if(!req.session.user){
        return res.redirect("/login");
    }
    res.render('profile',{"name":req.session.user.name,"email":req.session.user.email,"phone":req.session.user.phonenumber,"address":req.session.user.address,"city":req.session.user.city,"state":req.session.user.state,"country":req.session.user.country,"zipcode":req.session.user.zipcode});
});


app.get('/about',(req,res)=>{
    res.render('about');
});
// Render Register Page
app.get("/register", (req, res) => {
    res.render('register');
});

// Register Route

app.post('/register', async (req, res) => {
    try {
        console.log("Received data:", req.body); // Debugging

        const { uemail,uname,uphone,uaddress,ucity,ustate,ucountry,upincode , upassword } = req.body;

        if (!uemail||!uname ||!uphone || !uaddress || !ucity || !ustate || !ucountry || !upincode || !upassword ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: uemail });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(upassword, salt);

        const newUser = new User({
            email: uemail,
            name:uname,
            phonenumber:uphone,
            address:uaddress,
            city:ucity,
            state:ustate,
            country:ucountry,
            zipcode:upincode,
            password: hashedPassword // Store hashed password
        });

        await newUser.save();
        console.log("✅ User registered successfully");

        res.redirect('/login'); // Redirect to login page after registration

    } catch (error) {
        console.error("❌ Error saving user:", error);
        res.status(400).json({ message: "Error creating user", error });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`🔑 Login attempt: ${email}`);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log("⚠️ User not found");
            return res.status(400).send("User not found");
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Incorrect password");
            return res.status(400).send("Incorrect password");
        }

        // Set user session
        req.session.user = user;
        console.log("✅ Login successful!");
        res.redirect("/mainhome",);

    } catch (err) {
        console.error("❌ Error logging in:", err);
        res.status(500).send("Error logging in");
    }
});

// Dashboard Route (Only if logged in)
app.get("/home", (req, res) => {
    /*if (!req.session.user) {
        return res.redirect("/login");
    }
    else{
        res.render('home',{"Name":req.session.user.email});
    }
    res.send(`<h1>Welcome, ${req.session.user.email}</h1> <a href='/logout'>Logout</a>`);*/
    res.render('home');
});

// Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send("Error logging out");
        }
        res.redirect("/home");
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
