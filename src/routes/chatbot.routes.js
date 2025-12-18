const express = require("express");
const router = express.Router();
const {
  chat,
  recommend,
  readingGuide,
  compareBooks,
  findSimilarBooks,
  reviewBook,
  summarizeBook,
  bookQA,
} = require("../controllers/chatbot.controller");

// Chat tổng quát - hỏi đáp và gợi ý
router.post("/chat", chat);

// Gợi ý sách thông minh
router.post("/recommend", recommend);

// Định hướng đọc sách
router.post("/guide", readingGuide);

// So sánh sách
router.post("/compare", compareBooks);

// Tìm sách tương tự
router.post("/similar", findSimilarBooks);

// Đánh giá sách
router.post("/review", reviewBook);

// Tóm tắt sách
router.post("/summarize", summarizeBook);

// Hỏi về sách cụ thể
router.post("/book-qa", bookQA);

module.exports = router;

