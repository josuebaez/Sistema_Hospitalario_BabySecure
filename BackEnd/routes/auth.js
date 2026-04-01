import Express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { protect } from "../middleware/auth.js";

const router = Express.Router();

const cookiesOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
}

const generateToken = (user) => {
    return jwt.sign({id: user}, process.env.JWT_SECRET, {expiresIn: "30d"});
}

router.post("/register", async (req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({message: 'Por favor, completa todos los campos'});
    }

    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if(userExists.rows.length > 0){
        return res.status(400).json({message: 'El usuario ya existe'});
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
        [name, email, hashedPassword]
    );

    const token = generateToken(newUser.rows[0].id);

    res.cookie("token", token, cookiesOptions);

    return res.status(201).json({user: newUser.rows[0]});

})

router.post("/login", async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({message: 'Por favor, completa todos los campos'});
    }

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if(user.rows.length === 0){
        return res.status(400).json({message: 'Usuario no encontrado'});
    }

    const userData = user.rows[0]; 

    const isMatch = await bcrypt.compare(password, userData.password);

    if(!isMatch){
        return res.status(400).json({message: 'Contraseña incorrecta'});
    }

    const token = generateToken(userData.id);

    res.cookie("token", token, cookiesOptions);

    res.json({user: {id: userData.id, name: userData.name, email: userData.email}});

})

router.get("/me", protect, async (req, res) => {
    res.json(req.user);
})

router.post("/logout", (req, res) => {
    res.cookie("token", "", {...cookiesOptions, maxAge: 1});
    res.json({message: 'Sesión cerrada'});
})

export default router;