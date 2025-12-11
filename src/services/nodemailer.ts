import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: process.env.NODEMAIL_USER,
    pass: process.env.NODEMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  const mailOptions = {
    from: "XEGALITY",
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendOTP = async (email: string, otp: string) => {
  try {
    console.log("email", email, otp);
    await sendEmail(
      email,
      `OTP for email verification`,
      `<h1>Your OTP is ${otp}</h1>`
    );

    return {
      success: true,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.log("error", error);
      console.log(error.message);
      return {
        success: false,
      };
    }
  }
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
