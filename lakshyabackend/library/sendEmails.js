const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    try{
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Lakshya App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
   console.log("Email sent successfully");
  } catch (error) {
    console.error("Email send failed:", error);
    throw error;
  }
};

module.exports = sendEmail;
