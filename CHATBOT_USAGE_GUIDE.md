### 1. 💬 Chat Tổng Quát (`/api/chatbot/chat`)

**Mục đích:** Hỏi đáp tự do về sách, tác giả, thể loại

**Câu mẫu:**
- "Bạn có sách về lập trình không?"
- "Giới thiệu cho tôi sách tiểu thuyết hay"
- "Sách nào phù hợp cho người mới bắt đầu học tiếng Anh?"
- "Tác giả nào viết sách về kinh doanh?"
- "Thể loại nào phổ biến nhất?"
- "So sánh sách A và sách B"
- "Sách nào rẻ nhất trong cửa hàng?"

### 2. 🔍 Gợi Ý Sách (`/api/chatbot/recommend`)

**Mục đích:** Tìm sách phù hợp với nhu cầu cụ thể

**Câu mẫu:**
- "Tôi muốn tìm sách tiểu thuyết tình cảm lãng mạn"
- "Gợi ý sách self-help về phát triển bản thân"
- "Sách khoa học viễn tưởng hay"
- "Sách dạy nấu ăn cho người mới"
- "Sách lịch sử Việt Nam"
- "Sách thiếu nhi hay cho bé 5 tuổi"
- "Sách về đầu tư tài chính"

### 3. 📚 Định Hướng Đọc Sách (`/api/chatbot/guide`)

**Mục đích:** Tư vấn lộ trình đọc sách theo mục đích

**Câu mẫu:**
- "Tôi muốn học lập trình web, nên bắt đầu từ đâu?"
- "Tư vấn sách cho sinh viên năm nhất"
- "Lộ trình đọc sách để cải thiện kỹ năng giao tiếp"
- "Sách nào phù hợp cho người đi làm muốn học thêm?"
- "Hướng dẫn đọc sách để thi IELTS"

### 4. ⚖️ So Sánh Sách (`/api/chatbot/compare`)

**Mục đích:** So sánh 2-3 cuốn sách

**Câu mẫu:**
- "So sánh sách A và sách B"
- "Cuốn nào tốt hơn giữa sách X, Y, Z?"
- "So sánh giá cả và nội dung của 3 cuốn sách này"
- "Sách nào phù hợp hơn cho người mới bắt đầu?"


### 5. 🔗 Tìm Sách Tương Tự (`/api/chatbot/similar`)

**Mục đích:** Tìm sách giống với sách đã chọn

**Câu mẫu:**
- "Sách nào tương tự với [Tên sách]?"
- "Gợi ý sách cùng thể loại với cuốn này"
- "Sách của cùng tác giả"
- "Sách có nội dung tương tự"

### 6. ⭐ Đánh Giá Sách (`/api/chatbot/review`)

**Mục đích:** Xem đánh giá AI về một cuốn sách

**Câu mẫu:**
- "Đánh giá cuốn sách này"
- "Sách này có điểm mạnh gì?"
- "Cuốn sách này phù hợp cho ai?"
- "Review sách [Tên sách]"

### 7. 📄 Tóm Tắt Sách (`/api/chatbot/summarize`)

**Mục đích:** Xem tóm tắt nội dung sách

**Câu mẫu:**
- "Tóm tắt cuốn sách này"
- "Nội dung chính của sách là gì?"
- "Tóm tắt ngắn gọn cuốn [Tên sách]"
- "Điểm chính trong sách này là gì?"

### 8. ❓ Hỏi Về Sách Cụ Thể (`/api/chatbot/book-qa`)

**Mục đích:** Đặt câu hỏi về một cuốn sách cụ thể

**Câu mẫu:**
- "Cuốn sách này phù hợp cho ai?"
- "Sách này có khó không?"
- "Nội dung chính của sách là gì?"
- "Sách này dài bao nhiêu trang?"
- "Tác giả viết sách này khi nào?"
- "Sách này có phù hợp cho người mới bắt đầu không?"

## 🎯 Các Tình Huống Sử Dụng Thực Tế

### Tình Huống 1: Tìm Sách Mới
```
User: "Tôi muốn đọc sách về phát triển bản thân"
→ Bot: Gợi ý danh sách sách phù hợp
```

### Tình Huống 2: So Sánh Trước Khi Mua
```
User: "So sánh sách A và sách B cho tôi"
→ Bot: So sánh chi tiết và đưa ra recommendation
```

### Tình Huống 3: Tìm Sách Tương Tự
```
User: "Tôi thích cuốn X, có sách nào tương tự không?"
→ Bot: Gợi ý danh sách sách tương tự
```

### Tình Huống 4: Định Hướng Học Tập
```
User: "Tôi muốn học lập trình, nên bắt đầu từ đâu?"
→ Bot: Đưa ra lộ trình đọc sách chi tiết
```

### Tình Huống 5: Xem Review Nhanh
```
User: "Đánh giá cuốn sách này cho tôi"
→ Bot: Đưa ra review với điểm mạnh/yếu, rating
```