const Category = require("../models/category.model");
const Book = require("../models/book.model");

// Tạo thể loại
exports.createCategory = async (req, res) => {
  try {
    const category = await Category.create({ name: req.body.name });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Lấy tất cả thể loại
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    
    // Đếm số lượng sách cho mỗi category
    const categoriesWithQuantity = await Promise.all(
      categories.map(async (category) => {
        const quantity = await Book.countDocuments({
          category: category._id,
          isDelete: false,
        });
        
        return {
          ...category.toObject(),
          quantity,
        };
      })
    );
    
    res.status(200).json({ success: true, data: categoriesWithQuantity });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};