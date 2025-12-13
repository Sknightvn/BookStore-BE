const User = require("../models/user.model")
const asyncHandler = require("../middleware/async.middleware")
const ErrorResponse = require("../utils/errorResponse")

// @desc    Lấy tất cả người dùng
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Lấy một người dùng
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`Không tìm thấy người dùng với ID: ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Tạo người dùng
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body)

  res.status(201).json({
    success: true,
    data: user,
  })
})

// @desc    Cập nhật người dùng
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    return next(new ErrorResponse(`Không tìm thấy người dùng với ID: ${req.params.id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Xóa người dùng
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    return next(new ErrorResponse(`Không tìm thấy người dùng với ID: ${req.params.id}`, 404))
  }

  await user.remove()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Tạo productsCart cho User
// @route   POST /api/users/cart
// @access  Private
exports.createCart = asyncHandler(async (req, res, next) => {
  const { userId, email, productsCart } = req.body

  // Tìm user theo userId hoặc email
  let user
  if (userId) {
    user = await User.findById(userId)
  } else if (email) {
    user = await User.findOne({ email })
  } else {
    return next(new ErrorResponse("Vui lòng cung cấp userId hoặc email", 400))
  }

  if (!user) {
    return next(new ErrorResponse("Không tìm thấy người dùng", 404))
  }

  // Kiểm tra productsCart có đúng format không
  if (!Array.isArray(productsCart)) {
    return next(new ErrorResponse("productsCart phải là một mảng", 400))
  }

  // Validate từng item trong cart
  for (const item of productsCart) {
    if (!item.product || !item.product.id || !item.product.title || !item.product.price) {
      return next(new ErrorResponse("Mỗi item trong cart phải có product với id, title, price", 400))
    }
    if (!item.quantity || item.quantity < 1) {
      return next(new ErrorResponse("Quantity phải lớn hơn 0", 400))
    }
  }

  // Gán productsCart cho user
  user.productsCart = productsCart
  await user.save()

  res.status(201).json({
    success: true,
    data: user.productsCart,
  })
})

// @desc    Cập nhật productsCart của User
// @route   PUT /api/users/cart
// @access  Private
exports.updateCart = asyncHandler(async (req, res, next) => {
  const { userId, email, productsCart } = req.body

  // Tìm user theo userId hoặc email
  let user
  if (userId) {
    user = await User.findById(userId)
  } else if (email) {
    user = await User.findOne({ email })
  } else {
    return next(new ErrorResponse("Vui lòng cung cấp userId hoặc email", 400))
  }

  if (!user) {
    return next(new ErrorResponse("Không tìm thấy người dùng", 404))
  }

  // Kiểm tra productsCart có đúng format không
  if (!Array.isArray(productsCart)) {
    return next(new ErrorResponse("productsCart phải là một mảng", 400))
  }

  // Validate từng item trong cart
  for (const item of productsCart) {
    if (!item.product || !item.product.id || !item.product.title || !item.product.price) {
      return next(new ErrorResponse("Mỗi item trong cart phải có product với id, title, price", 400))
    }
    if (!item.quantity || item.quantity < 1) {
      return next(new ErrorResponse("Quantity phải lớn hơn 0", 400))
    }
  }

  // Cập nhật productsCart
  user.productsCart = productsCart
  await user.save()

  res.status(200).json({
    success: true,
    data: user.productsCart,
  })
})

// @desc    Lấy productsCart theo user-id hoặc email
// @route   GET /api/users/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res, next) => {
  // Hỗ trợ cả query params và body (để tương thích với payload)
  const userId = req.query.userId || req.body.userId
  const email = req.query.email || req.body.email

  // Tìm user theo userId hoặc email
  let user
  if (userId) {
    user = await User.findById(userId)
  } else if (email) {
    user = await User.findOne({ email })
  } else {
    return next(new ErrorResponse("Vui lòng cung cấp userId hoặc email", 400))
  }

  if (!user) {
    return next(new ErrorResponse("Không tìm thấy người dùng", 404))
  }

  res.status(200).json({
    success: true,
    data: user.productsCart || [],
  })
})