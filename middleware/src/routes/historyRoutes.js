import express from "express";
import multer from "multer";
import { newHistory } from "../controllers/historyControllers/newHistory.js";
import { getHistory } from "../controllers/historyControllers/getHistory.js";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

router.post("/new", upload.single("document"), newHistory);
router.get("/get", getHistory);

export default router;