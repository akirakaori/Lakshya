const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    try{
  console.log("=== Email Configuration ===");
  console.log("BREVO_LOGIN:", process.env.BREVO_LOGIN ? "Set" : "Missing");
  console.log("BREVO_PASS:", process.env.BREVO_PASS ? "Set" : "Missing");
  console.log("BREVO_FROM:", process.env.BREVO_FROM ? "Set" : "Missing");
  console.log("Recipient:", to);
  
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_LOGIN,
      pass: process.env.BREVO_PASS,
    },
  });

  const mailOptions = {
    from: process.env.BREVO_FROM,
    to,
    subject,
    text,
  };
  
  console.log("Attempting to send email...");
  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("=== Email Send Error ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    throw error;
  }
};

module.exports = sendEmail;
