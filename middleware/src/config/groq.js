import Groq from 'groq-sdk';
import dotenv from 'dotenv';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;