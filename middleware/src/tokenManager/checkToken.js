/*
JTW FOR SESSION MANAGEMENT
TOKEN MANAGER FILES ARE STILL NOT DONE SO MIGHT BE BUGGY
*/

import jwt from "jsonwebtoken";

export const checkToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error("Invalid token");
    }
};