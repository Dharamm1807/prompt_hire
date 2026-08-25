/*
BUM
*/

import {login} from "../controllers/loginController.js";
import {signup} from "../controllers/signupController.js";
import express from "express";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);   


export default router;