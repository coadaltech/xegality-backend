import * as nodemailer from "nodemailer";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // secure SMTP port
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendContactEmail = async (data: ContactFormData) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "xegality@gmail.com",
    subject: `Contact Form: ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; margin-bottom: 20px;">New Contact Form</h2>
        
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        
        <div style="margin-top: 15px;">
          <strong>Message:</strong>
          <div style="background: #f5f5f5; padding: 10px; margin-top: 5px; border-radius: 4px;">
            ${data.message.replace(/\n/g, "<br>")}
          </div>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">Sent on ${new Date().toLocaleString()}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
