import express from 'express';
import {addMessage} from '../controllers/messageControllers/addMessage.js';
import { getMessages } from '../controllers/messageControllers/getMessages.js';
const router = express.Router();

router.post('/send', addMessage);
router.post('/get', getMessages);

export default router;

