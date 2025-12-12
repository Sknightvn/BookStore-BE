const express = require("express")
const dotenv = require("dotenv")
const connectDB = require("./src/config/mongodb")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const { errorHandler } = require("./src/middleware/error.middleware")
const path = require("path")

// Import routes
const authRoutes = require("./src/routes/auth.routes")
const userRoutes = require("./src/routes/user.routes")
const employeeRoutes = require("./src/routes/employee.routes")
const transactionRoutes = require("./src/routes/transaction.routes")
const payrollRoutes = require("./src/routes/payroll.routes")
const attendanceRoutes = require("./src/routes/attendance.routes")
const customerRoutes = require("./src/routes/customer.routes")
const bookRoutes = require("./src/routes/book.routes")
const categoryRoutes = require("./src/routes/category.routes")
const warehouseRoutes = require("./src/routes/warehouse.routes");
const employeesRoutes = require("./src/routes/employees.router");
const orderRoutes = require("./src/routes/order.routes");
const promotionRoutes = require("./src/routes/promotionRoutes")
const paymentRoutes = require("./src/routes/paymentRoutes");
const statisticsRoutes = require("./src/routes/statistics.router");
const TransactionBookRoutes = require("./src/routes/transactionBook.routes")
const returnRoutes = require("./src/routes/returnRoutes")
// Cấu hình dotenv
dotenv.config()

// Kết nối MongoDB
connectDB()

// Khởi tạo Express app
const app = express()
const http = require("http")
const { Server } = require("socket.io")

// Tạo HTTP server
const server = http.createServer(app)

// Khởi tạo Socket.io với CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:3001","https://tmdt-sach-4zyw.vercel.app","https://tmdt-sach.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
})

// Export io để sử dụng trong controllers
global.io = io

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id)
  
  // Client join room theo orderId
  socket.on("join-order", (orderId) => {
    socket.join(`order-${orderId}`)
    console.log(`📦 Socket ${socket.id} joined order-${orderId}`)
  })

  // Client leave room
  socket.on("leave-order", (orderId) => {
    socket.leave(`order-${orderId}`)
    console.log(`📦 Socket ${socket.id} left order-${orderId}`)
  })

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id)
  })
})

// Cấu hình CORS - cho phép frontend truy cập
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173" , "http://localhost:3000","http://localhost:3001","https://tmdt-sach-4zyw.vercel.app","https://tmdt-sach.vercel.app"],
    credentials: true, // Cho phép gửi cookie qua CORS
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  
  }),
)
 
// Middleware
app.use(cookieParser()) // Xử lý cookie
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Phục vụ tệp tĩnh
app.use(express.static(path.join(__dirname, "public")))

// Middleware để log request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/employees", employeeRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/payrolls", payrollRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/customer", customerRoutes)
app.use("/api/books", bookRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/employeesID", employeesRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/promotions", promotionRoutes)
app.use("/api/payment", paymentRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/transactionBook",TransactionBookRoutes)
app.use("/api/returns", returnRoutes);

// Route mặc định
app.get("/", (req, res) => res.send("API is running"))

// Middleware xử lý lỗi
app.use(errorHandler)

// Khởi động server với Socket.io
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`🔌 Socket.io ready for realtime updates`)
})
