const Book = require("../models/book.model");
const Category = require("../models/category.model");
const Customer = require("../models/customer.model");
const cloudinary = require("../config/cloudinary");
const asyncHandler = require("../middleware/async.middleware");
const ErrorResponse = require("../utils/errorResponse");

exports.createBook = async (req, res) => {
  try {
    const { title, author, ISSN, category, price, publishYear, pages, description ,volume} = req.body;

    // Kiểm tra thể loại tồn tại
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: "Thể loại không tồn tại" });
    }

    // Upload ảnh lên Cloudinary nếu có
    let imageUrl = null;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "books",
      });
      imageUrl = uploadResult.secure_url;
    }

    // Tạo sách mới
    const newBook = await Book.create({
      title,
      author,
      ISSN,
      category,
      price,
      publishYear,
      pages,
      description,
      // discount: 0,
      coverImage: imageUrl,
      volume: volume || null,
      isDelete: false, 
    });

    res.status(201).json({ success: true, data: newBook });
  } catch (error) {
    // ⚠️ Bắt lỗi trùng ISBN
    if (error.code === 11000 && error.keyPattern?.ISSN) {
      return res.status(400).json({
        success: false,
        message: `Mã ISBN "${error.keyValue.ISSN}" đã tồn tại, vui lòng nhập mã khác.`,
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    
    const skip = (page - 1) * limit;
    
    // Lấy tất cả sách chưa bị xóa, bao gồm cả sách có stock === 0
    const total = await Book.countDocuments({ isDelete: false });
    
    const totalPages = Math.ceil(total / limit);
    
    // Trả về tất cả sách (bao gồm stock === 0), chỉ lọc theo isDelete
    const books = await Book.find({ isDelete: false })
      .populate("category", "name")
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({ 
      success: true, 
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔎 Tìm sách theo ID, chỉ lấy sách chưa bị xóa
    const book = await Book.findOne({ _id: id, isDelete: false })
      .populate("category", "name")
      .populate("reviews.customer", "fullName email");

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sách hoặc sách đã bị xóa.",
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Lỗi khi lấy sách theo ID:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thông tin sách.",
      error: error.message,
    });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sách" });
    } else {
      book.isDelete = "true";
      await book.save();
      return res.status(200).json({ success: true, message: "Xóa sách thành công" });
    }
  } catch {
    res.status(400).json({ success: false, message: error.message });
  }
}
exports.updateBook = async (req, res) => {
    console.log(req.body);
console.log(req.file);

  try {
    // Nếu dùng multer (form-data) thì req.body có thể nằm trong req.body hoặc req.fields
    const data = req.body || req.fields || {};

    const {
      title,
      author,
      ISSN,
      category,
      price,
      publishYear,
      pages,
      description,
    } = data;

    // Kiểm tra sách tồn tại
    const book = await Book.findOne({ _id: req.params.id, isDelete: false });
    if (!book) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sách hoặc đã bị xóa" });
    }

    // Nếu có file ảnh mới thì upload
    let imageUrl = book.coverImage;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "books",
      });
      imageUrl = uploadResult.secure_url;
    }

    // Cập nhật dữ liệu
    book.title = title || book.title;
    book.author = author || book.author;
    book.ISSN = ISSN || book.ISSN;
    book.category = category || book.category;
    book.price = price || book.price;
    book.publishYear = publishYear || book.publishYear;
    book.pages = pages || book.pages;
    book.description = description || book.description;
    book.coverImage = imageUrl;

    await book.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật sách thành công!",
      data: book,
    });
  } catch (error) {
    console.error("Lỗi cập nhật sách:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật sách",
      error: error.message,
    });
  }
};

// ======================
// THÊM ĐÁNH GIÁ VÀ RATING CHO SÁCH
// ======================
exports.addReview = asyncHandler(async (req, res, next) => {
  const { bookId } = req.params;
  const { rating, review } = req.body;

  // Kiểm tra rating bắt buộc
  if (!rating && rating !== 0) {
    return next(new ErrorResponse("Vui lòng chọn số sao đánh giá", 400));
  }

  // Chuyển đổi rating sang số
  const ratingNumber = Number(rating);

  // Kiểm tra rating hợp lệ (1-5 và là số nguyên)
  if (isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5 || !Number.isInteger(ratingNumber)) {
    return next(new ErrorResponse("Số sao phải là số nguyên từ 1 đến 5", 400));
  }

  // Kiểm tra sách tồn tại
  const book = await Book.findOne({ _id: bookId, isDelete: false });
  if (!book) {
    return next(new ErrorResponse("Không tìm thấy sách hoặc sách đã bị xóa", 404));
  }

  // Lấy customer từ user (req.user được set từ auth middleware)
  const customer = await Customer.findOne({ user: req.user._id, isActive: true });
  if (!customer) {
    return next(new ErrorResponse("Không tìm thấy thông tin khách hàng", 404));
  }

  // Kiểm tra xem customer đã đánh giá sách này chưa
  const existingReviewIndex = book.reviews.findIndex(
    (r) => r.customer.toString() === customer._id.toString()
  );

  if (existingReviewIndex !== -1) {
    // Cập nhật đánh giá đã tồn tại
    book.reviews[existingReviewIndex].rating = ratingNumber;
    book.reviews[existingReviewIndex].review = review || "";
    book.reviews[existingReviewIndex].createdAt = Date.now();
  } else {
    // Thêm đánh giá mới
    book.reviews.push({
      customer: customer._id,
      rating: ratingNumber,
      review: review || "",
    });
  }

  // Tính toán lại averageRating
  if (book.reviews.length > 0) {
    const totalRating = book.reviews.reduce((sum, r) => sum + r.rating, 0);
    book.averageRating = Number((totalRating / book.reviews.length).toFixed(2));
  } else {
    book.averageRating = 0;
  }

  await book.save();

  // Populate customer info trong response
  await book.populate("reviews.customer", "fullName email");

  res.status(200).json({
    success: true,
    message: existingReviewIndex !== -1 ? "Đã cập nhật đánh giá thành công" : "Đã thêm đánh giá thành công",
    data: book,
  });
});