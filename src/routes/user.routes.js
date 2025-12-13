const express = require("express")
const { getUsers, getUser, createUser, updateUser, deleteUser, createCart, updateCart, getCart } = require("../controllers/user.controller")

const User = require("../models/user.model")

const router = express.Router()

const advancedResults = require("../middleware/advancedResults.middleware")
const { protect, authorize } = require("../middleware/auth.middleware")

// Áp dụng middleware bảo vệ cho tất cả các routes
router.use(protect)

// Cart routes - không yêu cầu admin, chỉ cần authenticate
router.route("/cart").post(createCart).put(updateCart).get(getCart)

// Admin routes - yêu cầu quyền admin
router.use(authorize("admin"))
router.route("/").get(advancedResults(User), getUsers).post(createUser)

router.route("/:id").get(getUser).put(updateUser).delete(deleteUser)

module.exports = router
