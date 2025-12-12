const { Resend } = require("resend");
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

const sendEmail = async (to, subject, text) => {
  const fromEmail = process.env.FROM_EMAIL;
  const fromName = process.env.FROM_NAME;

  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY chưa được cấu hình");
  }

  if (!fromEmail) {
    throw new Error("FROM_EMAIL chưa được cấu hình");
  }

  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    text,
  });

  if (error) {
    // Log chi tiết để debug khi gửi thất bại
    console.error("Send email failed:", error);
    throw new Error(`Gửi email thất bại: ${error.message || "unknown error"}`);
  }

  return data;
};

module.exports = sendEmail;