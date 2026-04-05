import jwt from "jsonwebtoken";

export const generateToken = (usuario) => {
    return jwt.sign(
        { id: usuario.id, rol: usuario.rol }, 
        process.env.JWT_SECRET, 
        { expiresIn: "30d" }
    );
};

export const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
};