// utils/sendMail.js
import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL and EMAIL_PASS must be configured before sending OTP email");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ""),
      },
    });
  }
  return transporter;
};

export const sendOtpMail = async (email, otp) => {
  const info = await getTransporter().sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "OTP Verification",
    text: `Your Sri Amman Transport verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your Sri Amman Transport verification code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  });
  console.log(`OTP email accepted by SMTP: ${info.messageId}`);
  return info;
};

export const verifyMailTransport = () => getTransporter().verify();