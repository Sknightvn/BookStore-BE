const Groq = require("groq-sdk");

// Khởi tạo Groq client dùng chung
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = groq;

