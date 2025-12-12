const sgMail = require("@sendgrid/mail");

// Prefer lấy từ env, fallback theo request (không khuyến khích để lâu dài)
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async (to, subject, text) => {
  const fromEmail = process.env.FROM_EMAIL;
  const fromName = process.env.FROM_NAME;

  if (!fromEmail) {
    throw new Error("FROM_EMAIL chưa được cấu hình");
  }

  const message = {
    to,
    from: fromName ? { email: fromEmail, name: fromName } : fromEmail,
    subject,
    text,
  };

  await sgMail.send(message);
};

module.exports = sendEmail;