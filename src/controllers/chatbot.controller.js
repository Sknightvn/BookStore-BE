const groq = require("../utils/groq.config");
const Book = require("../models/book.model");
const Category = require("../models/category.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const asyncHandler = require("../middleware/async.middleware");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Chatbot AI - Trả lời câu hỏi và gợi ý sách
// @route   POST /api/chatbot/chat
// @access  Public
exports.chat = asyncHandler(async (req, res, next) => {
  const { message, userId } = req.body;

  if (!message || message.trim().length === 0) {
    return next(new ErrorResponse("Vui lòng nhập câu hỏi", 400));
  }

  try {
    // Lấy dữ liệu sách và danh mục từ database
    const books = await Book.find({ isDelete: false })
      .populate("category", "name")
      .limit(50)
      .select("title author category price description publishYear pages");

    const categories = await Category.find().select("name");

    // Lấy lịch sử mua hàng nếu có userId
    let userHistory = [];
    if (userId) {
      const orders = await Order.find({
        user: userId,
        status: { $in: ["delivered", "completed"] },
      })
        .populate("items.productId", "title author category")
        .limit(10);

      userHistory = orders.flatMap((order) =>
        order.items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
        }))
      );
    }

    // Tạo context cho AI
    const booksContext = books
      .map(
        (book) =>
          `- "${book.title}" của ${book.author}, thể loại: ${book.category?.name || "N/A"}, giá: ${book.price?.toLocaleString("vi-VN")}đ${book.description ? `, mô tả: ${book.description.substring(0, 100)}...` : ""}`
      )
      .join("\n");

    const categoriesContext = categories.map((cat) => `- ${cat.name}`).join("\n");

    const userHistoryContext =
      userHistory.length > 0
        ? `\nLịch sử mua hàng của người dùng:\n${userHistory.map((item) => `- ${item.title} (${item.quantity} cuốn)`).join("\n")}`
        : "";

    // System prompt cho chatbot
    const systemPrompt = `Bạn là trợ lý AI thông minh của một cửa hàng sách trực tuyến. Nhiệm vụ của bạn:

1. **Hỏi đáp về sách**: Trả lời câu hỏi về sách, tác giả, thể loại, nội dung
2. **Gợi ý sách**: Đề xuất sách phù hợp dựa trên sở thích, mục đích đọc, thể loại yêu thích
3. **Định hướng đọc sách**: Tư vấn sách phù hợp cho người mới bắt đầu, học sinh, sinh viên, người đi làm
4. **So sánh sách**: So sánh các cuốn sách khi được yêu cầu
5. **Tìm kiếm thông minh**: Hiểu ngữ cảnh và tìm sách phù hợp

Hãy trả lời một cách thân thiện, nhiệt tình và hữu ích. Nếu không có sách phù hợp trong danh sách, hãy đề xuất thể loại hoặc gợi ý chung.

Danh sách sách hiện có:
${booksContext}

Danh sách thể loại:
${categoriesContext}
${userHistoryContext}

Lưu ý: Khi gợi ý sách, hãy đề cập đến tên sách chính xác từ danh sách trên.`;

    // Gọi Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.3-70b-versatile", // Model free và mạnh
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || "Xin lỗi, tôi không thể trả lời câu hỏi này.";

    res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        model: "llama-3.3-70b-versatile",
      },
    });
  } catch (error) {
    console.error("Groq API Error:", error);
    
    // Xử lý các loại lỗi khác nhau
    if (error.status === 429) {
      return next(new ErrorResponse("Quá nhiều requests, vui lòng thử lại sau", 429));
    }
    if (error.status === 401) {
      return next(new ErrorResponse("Lỗi xác thực API. Vui lòng kiểm tra API key.", 401));
    }
    
    return next(
      new ErrorResponse(
        error.message || "Có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại.",
        500
      )
    );
  }
});

// @desc    Gợi ý sách thông minh dựa trên yêu cầu
// @route   POST /api/chatbot/recommend
// @access  Public
exports.recommend = asyncHandler(async (req, res, next) => {
  const { query, userId, limit = 5 } = req.body;

  if (!query || query.trim().length === 0) {
    return next(new ErrorResponse("Vui lòng mô tả sách bạn muốn tìm", 400));
  }

  try {
    // Lấy tất cả sách
    const allBooks = await Book.find({ isDelete: false })
      .populate("category", "name")
      .select("title author category price description publishYear pages coverImage stock");

    // Lấy lịch sử mua hàng nếu có
    let userHistory = [];
    if (userId) {
      const orders = await Order.find({
        user: userId,
        status: { $in: ["delivered", "completed"] },
      })
        .populate("items.productId", "title author category")
        .limit(10);

      userHistory = orders.flatMap((order) =>
        order.items.map((item) => ({
          title: item.title,
          author: item.productId?.author || "",
        }))
      );
    }

    // Tạo context cho AI
    const booksContext = allBooks
      .map(
        (book) =>
          `ID: ${book._id}, Tên: "${book.title}", Tác giả: ${book.author}, Thể loại: ${book.category?.name || "N/A"}, Giá: ${book.price?.toLocaleString("vi-VN")}đ, Mô tả: ${book.description || "Không có mô tả"}`
      )
      .join("\n");

    const userHistoryContext =
      userHistory.length > 0
        ? `\nSách người dùng đã mua:\n${userHistory.map((item) => `- ${item.title} (${item.author})`).join("\n")}`
        : "";

    // Prompt cho AI để gợi ý
    const prompt = `Dựa trên yêu cầu: "${query}"
${userHistoryContext}

Danh sách sách có sẵn:
${booksContext}

Hãy phân tích và trả về DANH SÁCH ID của ${limit} cuốn sách phù hợp nhất (chỉ trả về ID, mỗi ID một dòng, không giải thích thêm).
Format: 
ID1
ID2
ID3
...`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là hệ thống gợi ý sách thông minh. Chỉ trả về ID của sách, mỗi ID một dòng.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", // Model mạnh cho recommendation chính xác hơn
      temperature: 0.3,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Parse IDs từ response
    const bookIds = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line.length === 24) // MongoDB ObjectId length
      .slice(0, limit);

    // Lấy sách từ database
    const recommendedBooks = await Book.find({
      _id: { $in: bookIds },
      isDelete: false,
    })
      .populate("category", "name")
      .select("title author category price description publishYear pages coverImage stock");

    // Nếu AI không trả về đủ sách, bổ sung bằng tìm kiếm đơn giản
    if (recommendedBooks.length < limit) {
      const searchTerms = query.toLowerCase().split(" ");
      const additionalBooks = allBooks
        .filter(
          (book) =>
            !recommendedBooks.some((rb) => rb._id.toString() === book._id.toString()) &&
            searchTerms.some(
              (term) =>
                book.title.toLowerCase().includes(term) ||
                book.author.toLowerCase().includes(term) ||
                book.category?.name?.toLowerCase().includes(term) ||
                book.description?.toLowerCase().includes(term)
            )
        )
        .slice(0, limit - recommendedBooks.length);

      recommendedBooks.push(...additionalBooks);
    }

    res.status(200).json({
      success: true,
      data: {
        books: recommendedBooks.slice(0, limit),
        query: query,
        count: recommendedBooks.length,
      },
    });
  } catch (error) {
    console.error("Recommendation Error:", error);
    
    if (error.status === 429) {
      return next(new ErrorResponse("Quá nhiều requests, vui lòng thử lại sau", 429));
    }
    if (error.status === 401) {
      return next(new ErrorResponse("Lỗi xác thực API. Vui lòng kiểm tra API key.", 401));
    }
    
    return next(
      new ErrorResponse(
        error.message || "Có lỗi xảy ra khi gợi ý sách. Vui lòng thử lại.",
        500
      )
    );
  }
});

// @desc    Định hướng đọc sách - Tư vấn sách phù hợp
// @route   POST /api/chatbot/guide
// @access  Public
exports.readingGuide = asyncHandler(async (req, res, next) => {
  const { purpose, level, interests, userId } = req.body;

  if (!purpose) {
    return next(new ErrorResponse("Vui lòng cung cấp mục đích đọc sách", 400));
  }

  try {
    const books = await Book.find({ isDelete: false })
      .populate("category", "name")
      .limit(100)
      .select("title author category price description publishYear pages");

    const categories = await Category.find().select("name");

    const booksContext = books
      .map(
        (book) =>
          `- "${book.title}" của ${book.author}, thể loại: ${book.category?.name || "N/A"}, ${book.description ? `mô tả: ${book.description.substring(0, 150)}` : ""}`
      )
      .join("\n");

    const prompt = `Người dùng muốn đọc sách với:
- Mục đích: ${purpose}
- Trình độ: ${level || "Không xác định"}
- Sở thích: ${interests || "Không xác định"}

Danh sách sách có sẵn:
${booksContext}

Danh sách thể loại:
${categories.map((cat) => `- ${cat.name}`).join("\n")}

Hãy đưa ra lời khuyên chi tiết về:
1. Nên bắt đầu với thể loại nào
2. Gợi ý 3-5 cuốn sách cụ thể phù hợp (kèm lý do)
3. Lộ trình đọc sách đề xuất
4. Lời khuyên hữu ích khác

Hãy trả lời một cách nhiệt tình và chi tiết.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia tư vấn đọc sách với nhiều năm kinh nghiệm. Hãy đưa ra lời khuyên chi tiết và hữu ích.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 1500,
    });

    const guide = completion.choices[0]?.message?.content || "Xin lỗi, tôi không thể tạo hướng dẫn lúc này.";

    res.status(200).json({
      success: true,
      data: {
        guide: guide,
        purpose: purpose,
        level: level,
        interests: interests,
      },
    });
  } catch (error) {
    console.error("Reading Guide Error:", error);
    
    if (error.status === 429) {
      return next(new ErrorResponse("Quá nhiều requests, vui lòng thử lại sau", 429));
    }
    if (error.status === 401) {
      return next(new ErrorResponse("Lỗi xác thực API. Vui lòng kiểm tra API key.", 401));
    }
    
    return next(
      new ErrorResponse(
        error.message || "Có lỗi xảy ra khi tạo hướng dẫn. Vui lòng thử lại.",
        500
      )
    );
  }
});

// @desc    So sánh sách
// @route   POST /api/chatbot/compare
// @access  Public
exports.compareBooks = asyncHandler(async (req, res, next) => {
  const { bookIds, aspects } = req.body;

  if (!bookIds || !Array.isArray(bookIds) || bookIds.length < 2) {
    return next(new ErrorResponse("Vui lòng cung cấp ít nhất 2 bookIds để so sánh", 400));
  }

  if (bookIds.length > 3) {
    return next(new ErrorResponse("Chỉ có thể so sánh tối đa 3 cuốn sách", 400));
  }

  try {
    // Query chi tiết các sách
    const books = await Book.find({
      _id: { $in: bookIds },
      isDelete: false,
    })
      .populate("category", "name")
      .select("title author category price description publishYear pages coverImage stock");

    if (books.length !== bookIds.length) {
      return next(new ErrorResponse("Một hoặc nhiều sách không tồn tại", 404));
    }

    // Build context cho AI
    const booksContext = books
      .map(
        (book) =>
          `Sách: "${book.title}"
- Tác giả: ${book.author}
- Thể loại: ${book.category?.name || "N/A"}
- Giá: ${book.price?.toLocaleString("vi-VN")}đ
- Số trang: ${book.pages || "N/A"}
- Năm xuất bản: ${book.publishYear || "N/A"}
- Mô tả: ${book.description || "Không có mô tả"}
---`
      )
      .join("\n\n");

    const aspectsContext = aspects && aspects.length > 0 
      ? `Hãy so sánh các sách trên theo các khía cạnh: ${aspects.join(", ")}`
      : "Hãy so sánh các sách trên về: giá cả, nội dung, độ khó, đối tượng phù hợp";

    const prompt = `So sánh các cuốn sách sau:

${booksContext}

${aspectsContext}

Hãy đưa ra:
1. So sánh chi tiết từng khía cạnh
2. Ưu điểm và nhược điểm của từng cuốn sách
3. Kết luận: cuốn sách nào phù hợp nhất cho từng trường hợp sử dụng

Hãy trả lời một cách khách quan và chi tiết.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia đánh giá sách. Hãy so sánh các cuốn sách một cách khách quan và chi tiết.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 2000,
    });

    const comparison = completion.choices[0]?.message?.content || "Không thể so sánh các cuốn sách này.";

    // Tạo recommendation ngắn gọn
    const recommendationPrompt = `Dựa trên so sánh trên, hãy đưa ra kết luận ngắn gọn (1-2 câu) về cuốn sách phù hợp nhất cho người đọc phổ thông.`;

    const recommendationCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia tư vấn sách. Đưa ra lời khuyên ngắn gọn và rõ ràng.",
        },
        {
          role: "user",
          content: `${comparison}\n\n${recommendationPrompt}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 200,
    });

    const recommendation = recommendationCompletion.choices[0]?.message?.content || "Dựa trên so sánh, bạn nên chọn cuốn sách phù hợp nhất với nhu cầu của mình.";

    res.status(200).json({
      success: true,
      data: {
        comparison: comparison,
        recommendation: recommendation,
        books: books,
      },
    });
  } catch (error) {
    console.error("Compare Books Error:", error);
    
    if (error.status === 429) {
      return next(new ErrorResponse("Quá nhiều requests, vui lòng thử lại sau", 429));
    }
    if (error.status === 401) {
      return next(new ErrorResponse("Lỗi xác thực API. Vui lòng kiểm tra API key.", 401));
    }
    
    return next(
      new ErrorResponse(
        error.message || "Có lỗi xảy ra khi so sánh sách. Vui lòng thử lại.",
        500
      )
    );
  }
});

// @desc    Tìm sách tương tự
// @route   POST /api/chatbot/similar
// @access  Public
exports.findSimilarBooks = asyncHandler(async (req, res, next) => {
  const { bookId, limit = 5 } = req.body;

  if (!bookId) {
    return next(new ErrorResponse("Vui lòng cung cấp bookId", 400));
  }

  try {
    // Query sách gốc
    const originalBook = await Book.findOne({
      _id: bookId,
      isDelete: false,
    })
      .populate("category", "name")
      .select("title author category price description publishYear pages coverImage stock");

    if (!originalBook) {
      return next(new ErrorResponse("Không tìm thấy sách", 404));
    }

    // Query các sách khác (không bao gồm sách gốc)
    const candidateBooks = await Book.find({
      _id: { $ne: bookId },
      isDelete: false,
    })
      .populate("category", "name")
      .select("title author category price description publishYear pages coverImage stock");

    if (candidateBooks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          originalBook: originalBook,
          similarBooks: [],
          reason: "Không có sách tương tự trong hệ thống.",
        },
      });
    }

    // Build context
    const originalContext = `Sách gốc: "${originalBook.title}"
- Tác giả: ${originalBook.author}
- Thể loại: ${originalBook.category?.name || "N/A"}
- Mô tả: ${originalBook.description || "Không có mô tả"}`;

    const candidatesContext = candidateBooks
      .map(
        (book) =>
          `ID: ${book._id}, Tên: "${book.title}", Tác giả: ${book.author}, Thể loại: ${book.category?.name || "N/A"}, Mô tả: ${book.description || "Không có mô tả"}`
      )
      .join("\n");

    const prompt = `${originalContext}

Danh sách sách có sẵn:
${candidatesContext}

Hãy tìm ${limit} cuốn sách tương tự nhất với sách gốc dựa trên thể loại, tác giả, và nội dung.
Chỉ trả về ID của sách, mỗi ID một dòng, không giải thích thêm.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là hệ thống tìm sách tương tự. Chỉ trả về ID của sách, mỗi ID một dòng.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant", // Nhanh cho matching
      temperature: 0.3,
      max_tokens: 200,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Parse IDs
    const similarIds = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line.length === 24)
      .slice(0, limit);

    // Query sách tương tự
    let similarBooks = [];
    if (similarIds.length > 0) {
      similarBooks = await Book.find({
        _id: { $in: similarIds },
        isDelete: false,
      })
        .populate("category", "name")
        .select("title author category price description publishYear pages coverImage stock");
    }

    // Fallback: tìm sách cùng category hoặc cùng author
    if (similarBooks.length < limit) {
      const fallbackBooks = candidateBooks
        .filter(
          (book) =>
            !similarBooks.some((sb) => sb._id.toString() === book._id.toString()) &&
            (book.category?.name === originalBook.category?.name ||
              book.author === originalBook.author)
        )
        .slice(0, limit - similarBooks.length);

      similarBooks.push(...fallbackBooks);
    }

    // Tạo lý do gợi ý
    const reasonPrompt = `Giải thích ngắn gọn (1 câu) tại sao các sách này tương tự với "${originalBook.title}".`;

    const reasonCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là hệ thống giải thích gợi ý sách. Đưa ra lý do ngắn gọn và rõ ràng.",
        },
        {
          role: "user",
          content: reasonPrompt,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 100,
    });

    const reason = reasonCompletion.choices[0]?.message?.content || "Các sách này có nội dung hoặc thể loại tương tự.";

    res.status(200).json({
      success: true,
      data: {
        originalBook: originalBook,
        similarBooks: similarBooks.slice(0, limit),
        reason: reason,
      },
    });
  } catch (error) {
    console.error("Find Similar Books Error:", error);
    
    if (error.status === 429) {
      return next(new ErrorResponse("Quá nhiều requests, vui lòng thử lại sau", 429));
    }
    if (error.status === 401) {
      return next(new ErrorResponse("Lỗi xác thực API. Vui lòng kiểm tra API key.", 401));
    }
    
    return next(
      new ErrorResponse(
        error.message || "Có lỗi xảy ra khi tìm sách tương tự. Vui lòng thử lại.",
        500
      )
    );
  }
});

// @desc    Đánh giá sách
// @route   POST /api/chatbot/review
// @access  Public
exports.reviewBook = asyncHandler(async (req, res, next) => {
  const { bookId } = req.body;

  if (!bookId) {
    return next(new ErrorResponse("Vui lòng cung cấp bookId", 400));
  }

  try {
    const book = await Book.findOne({
      _id: bookId,
      isDelete: false,
    })
      .populate("category", "name")
      .select("title author category price description publishYear pages coverImage stock");

    if (!book) {
      return next(new ErrorResponse("Không tìm thấy sách", 404));
    }

    const bookContext = `Sách: "${book.title}"
- Tác giả: ${book.author}
- Thể loại: ${book.category?.name || "N/A"}
- Giá: ${book.price?.toLocaleString("vi-VN")}đ
- Số trang: ${book.pages || "N/A"}
- Năm xuất bản: ${book.publishYear || "N/A"}
- Mô tả: ${book.description || "Không có mô tả"}`;

    const prompt = `${bookContext}

Hãy đánh giá cuốn sách này và trả về kết quả theo format JSON sau:
{
  "summary": "Tóm tắt đánh giá tổng quan (2-3 câu)",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2", "Điểm mạnh 3"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "targetAudience": "Mô tả đối tượng phù hợp (1-2 câu)",
  "rating": 4.5
}

Chỉ trả về JSON, không có text thêm.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia đánh giá sách. Trả về kết quả dưới dạng JSON hợp lệ.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || "";

    // Parse JSON từ response
    let review;
    try {
      // Tìm JSON trong response (có thể có text thêm)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        review = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Không tìm thấy JSON trong response");
      }
    } catch (parseError) {
      // Fallback nếu không parse được JSON
      review = {
        summary: response.substring(0, 200) || "Đánh giá tổng quan về cuốn sách.",
        strengths: ["Nội dung hữu ích", "Dễ hiểu"],
        weaknesses: ["Cần cải thiện một số phần"],
        targetAudience: "Phù hợp cho người đọc quan tâm đến chủ đề này.",
        rating: 4.0,
      };
    }

    // Validate và đảm bảo đúng format
    if (!review.summary) review.summary = "Đánh giá tổng quan về cuốn sách.";
    if (!Array.isArray(review.strengths)) review.strengths = [];
    if (!Array.isArray(review.weaknesses)) review.weaknesses = [];
    if (!review.targetAudience) review.targetAudience = "Phù hợp cho người đọc quan tâm đến chủ đề này.";
    if (typeof review.rating !== "number" || review.rating < 0 || review.rating > 5) {
      review.rating = 4.0;
    }

    res.status(200).json({
      success: true,
      data: {
        book: book,
        review: review,
      },
    });
  } catch (error) {
    console.error("Review Book Error:", error);
    
    if (error.status === 429) {
      return next(new ErrorResponse("Quá nhiều requests, vui lòng thử lại sau", 429));
    }
    if (error.status === 401) {
      return next(new ErrorResponse("Lỗi xác thực API. Vui lòng kiểm tra API key.", 401));
    }
    
    return next(
      new ErrorResponse(
        error.message || "Có lỗi xảy ra khi đánh giá sách. Vui lòng thử lại.",
        500
      )
    );
  }
});

// @desc    Tóm tắt sách
// @route   POST /api/chatbot/summarize
// @access  Public
exports.summarizeBook = asyncHandler(async (req, res, next) => {
  const { bookId, length = "medium" } = req.body;

  if (!bookId) {
    return next(new ErrorResponse("Vui lòng cung cấp bookId", 400));
  }

  if (!["short", "medium", "long"].includes(length)) {
    return next(new ErrorResponse("Length phải là 'short', 'medium', hoặc 'long'", 400));
  }

  try {
    const book = await Book.findOne({
      _id: bookId,
      isDelete: false,
    })
      .populate("category", "name")
      .select("title author category price description publishYear pages coverImage stock");

    if (!book) {
      return next(new ErrorResponse("Không tìm thấy sách", 404));
    }

    if (!book.description) {
      return res.status(200).json({
        success: true,
        data: {
          book: book,
          summary: "Cuốn sách này chưa có mô tả chi tiết.",
          keyPoints: [],
        },
      });
    }

    const lengthInstructions = {
      short: "Tóm tắt ngắn gọn (2-3 câu)",
      medium: "Tóm tắt vừa phải (1 đoạn văn, 4-6 câu)",
      long: "Tóm tắt chi tiết (2-3 đoạn văn)",
    };

    const prompt = `Sách: "${book.title}" của ${book.author}
Thể loại: ${book.category?.name || "N/A"}

Mô tả sách:
${book.description}

Hãy ${lengthInstructions[length]} về nội dung cuốn sách này và liệt kê 3-5 điểm chính (key points).

Trả về kết quả theo format:
TÓM TẮT:
[Phần tóm tắt]

ĐIỂM CHÍNH:
1. [Điểm 1]
2. [Điểm 2]
3. [Điểm 3]
...`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là chuyên gia tóm tắt sách. Hãy tóm tắt chính xác và rõ ràng.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || "";

    // Parse summary và keyPoints
    let summary = "";
    let keyPoints = [];

    const summaryMatch = response.match(/TÓM TẮT:?\s*([\s\S]*?)(?=ĐIỂM CHÍNH|$)/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    } else {
      // Fallback: lấy phần đầu
      summary = response.split("ĐIỂM CHÍNH")[0]?.trim() || response.substring(0, 300);
    }

    const pointsMatch = response.match(/ĐIỂM CHÍNH:?\s*([\s\S]*)/i);
    if (pointsMatch) {
      const pointsText = pointsMatch[1];
      keyPoints = pointsText
        .split(/\d+\./)
        .map((point) => point.trim())
        .filter((point) => point.length > 0)
        .slice(0, 5);
    } else {
      // Fallback: tìm các dòng bắt đầu bằng số
      const lines = response.split("\n");
      keyPoints = lines
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
        .filter((point) => point.length > 0)
        .slice(0, 5);
    }

    if (keyPoints.length === 0) {
      keyPoints = ["Nội dung hữu ích", "Dễ hiểu", "Thực tế"];
    }

    res.status(200).json({
      success: true,
      data: {
        book: book,
        summary: summary || "Tóm tắt nội dung cuốn sách.",
        keyPoints: keyPoints,
      },
    });
  } catch (error) {
    console.error("Summarize Book Error:", error);
    
    if (error.status === 429) {
      return next(new ErrorResponse("Quá nhiều requests, vui lòng thử lại sau", 429));
    }
    if (error.status === 401) {
      return next(new ErrorResponse("Lỗi xác thực API. Vui lòng kiểm tra API key.", 401));
    }
    
    return next(
      new ErrorResponse(
        error.message || "Có lỗi xảy ra khi tóm tắt sách. Vui lòng thử lại.",
        500
      )
    );
  }
});

// @desc    Hỏi về sách cụ thể
// @route   POST /api/chatbot/book-qa
// @access  Public
exports.bookQA = asyncHandler(async (req, res, next) => {
  const { bookId, question } = req.body;

  if (!bookId) {
    return next(new ErrorResponse("Vui lòng cung cấp bookId", 400));
  }

  if (!question || question.trim().length === 0) {
    return next(new ErrorResponse("Vui lòng nhập câu hỏi", 400));
  }

  try {
    const book = await Book.findOne({
      _id: bookId,
      isDelete: false,
    })
      .populate("category", "name")
      .select("title author category price description publishYear pages coverImage stock");

    if (!book) {
      return next(new ErrorResponse("Không tìm thấy sách", 404));
    }

    const bookContext = `Sách: "${book.title}"
- Tác giả: ${book.author}
- Thể loại: ${book.category?.name || "N/A"}
- Giá: ${book.price?.toLocaleString("vi-VN")}đ
- Số trang: ${book.pages || "N/A"}
- Năm xuất bản: ${book.publishYear || "N/A"}
- Mô tả: ${book.description || "Không có mô tả"}`;

    const prompt = `${bookContext}

Câu hỏi: ${question}

Hãy trả lời câu hỏi về cuốn sách này dựa trên thông tin đã cung cấp. Nếu không đủ thông tin để trả lời chính xác, hãy nói rõ và đưa ra câu trả lời chung chung dựa trên thể loại và mô tả.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Bạn là trợ lý AI chuyên trả lời câu hỏi về sách. Hãy trả lời chính xác và hữu ích.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-8b-instant", // Nhanh cho Q&A
      temperature: 0.5,
      max_tokens: 500,
    });

    const answer = completion.choices[0]?.message?.content || "Xin lỗi, tôi không thể trả lời câu hỏi này.";

    res.status(200).json({
      success: true,
      data: {
        book: book,
        question: question,
        answer: answer,
      },
    });
  } catch (error) {
    console.error("Book QA Error:", error);
    
    if (error.status === 429) {
      return next(new ErrorResponse("Quá nhiều requests, vui lòng thử lại sau", 429));
    }
    if (error.status === 401) {
      return next(new ErrorResponse("Lỗi xác thực API. Vui lòng kiểm tra API key.", 401));
    }
    
    return next(
      new ErrorResponse(
        error.message || "Có lỗi xảy ra khi trả lời câu hỏi. Vui lòng thử lại.",
        500
      )
    );
  }
});

