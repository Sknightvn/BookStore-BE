require("dotenv").config(); // Load .env
const querystring = require("qs");
const crypto = require("crypto");

// 👉 Hàm sắp xếp object theo key (bắt buộc trong VNPay)
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// 👉 Hàm tạo URL thanh toán VNPay
exports.createVNPayUrl = async (req, res) => {
  try {
    // Lấy dateformat bằng dynamic import
    const dateFormat = (await import("dateformat")).default;

    // Lấy IP của client
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // Lấy thông tin từ env
    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
      throw new Error("Vui lòng kiểm tra file .env, chưa khai báo đủ thông tin VNPay");
    }

    const date = new Date();
    const createDate = dateFormat(date, "yyyymmddHHMMss");
    const orderId = dateFormat(date, "HHMMss");

    // Lấy dữ liệu từ body gửi lên
    const amount = req.body.amount;
    const bankCode = req.body.bankCode;
    const orderInfo = req.body.orderDescription;
    const orderType = req.body.orderType;
    let locale = req.body.language || "vn";

    const currCode = "VND";

    // Tạo params cho VNPay
    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: amount * 100, // VNPay yêu cầu nhân 100
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    // Sắp xếp key theo thứ tự a-z
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi ký hash
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    // Tạo URL redirect sang VNPay
    const paymentUrl = vnpUrl + "?" + querystring.stringify(vnp_Params, { encode: false });

    // Trả về URL cho FE (có thể dùng redirect hoặc trả JSON)
    res.status(200).json({
      code: "00",
      message: "success",
      data: paymentUrl,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo VNPay URL:", error);
    res.status(500).json({
      code: "99",
      message: "Lỗi khi tạo URL thanh toán VNPay",
      error: error.message,
    });
  }
};