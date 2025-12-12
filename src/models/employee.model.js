const mongoose = require("mongoose")

const EmployeeSchema = new mongoose.Schema(
  {
    // 🔹 Liên kết đến bảng User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: [true, "Vui lòng nhập email"],
      trim: true,
    },
    // 🔹 Mã nhân viên
    employeeId: {
      type: String,
      // unique: true,
      required: true,
    },

    // 🔹 Họ và tên
    firstName: {
      type: String,
      required: [true, "Vui lòng nhập họ nhân viên"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Vui lòng nhập tên nhân viên"],
      trim: true,
    },

    // 🔹 Vai trò (admin, employee, manager,...)
    role: {
      type: String,
      enum: ["admin", "employee", "manager", "staff"],
      default: "employee",
    },

    // 🔹 Giới tính
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    // 🔹 Ngày sinh
    dateOfBirth: {
      type: Date,
    },

    // 🔹 Số điện thoại
    phone: {
      type: String,
      trim: true,
    },

   

    // 🔹 Ngày bắt đầu làm việc
    joinDate: {
      type: Date,
      default: Date.now,
    },

    // 🔹 Avatar
    avatar: {
      type: String,
      default: "/images/default-avatar.png",
    },

    // 🔹 Trạng thái làm việc
    employmentStatus: {
      type: String,
      enum: ["active", "inactive", "nghi_viec"],
      default: "active",
    },

 
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("Employee", EmployeeSchema)