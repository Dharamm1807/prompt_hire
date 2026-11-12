/*
This file contains the login controller for handling user login requests. It verifies the user's credentials and generates a token upon successful authentication.
argon2 - performs password hashing and verification
pool - connects to the Supabase auth database using pg Pool

login requires only email and password. If the user is authenticated successfully, a token is generated and returned along with the user information.
The login function is exported as the default export of this module.
*/


import argon2 from "argon2";
import pool from "../config/auth_db.js";
import { createToken } from "../tokenManager/createToken.js";


export const login = async (req, res) => {
    console.log("Login endpoint hit ");
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    // Check if the user exists in the database(use email as the unique identifier for login)
    try {
        const result = await pool.query(
            `SELECT * 
            FROM public."Users" 
            WHERE email = $1`,
            [email]
        );

        // Check if user exists
        if (result.rows.length === 0) {
            console.log("User not found for email:", email);
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = result.rows[0];
        const hashedPassword = user.password; 

        //checks if the provided password matches the hashed password stored in the database
        const isValidPassword = await argon2.verify(hashedPassword, password);
        if (!isValidPassword) {
            return res.status(401).json({
                     message: "Invalid email or password."
            });
        }

        //this shit should probably be in a separate function but i dont care right now
        // If login is successful generate a token and send it back to the client
        const token = createToken({ username: user.username, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        //each time a user logs in, the token is updated in the database for that user
        await pool.query(
            `UPDATE public."Users" 
            SET token = $1 
            WHERE email = $2`,
            [token, email]
        );
        user.token = token; // Add the token to the user object before sending it back to the client
        res.status(200).json({ message: "Login successful.", user: { username: user.username, email: user.email }, token });
    } catch (error) {
        console.error("Error occurred while logging in:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

export default login;