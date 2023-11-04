import NodeMailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { AppError } from "../custom/customClass";

export default (mailOptions: Mail.Options) => {
  const transporter = NodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_EMAIL_PASS,
    },
  });

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) throw new AppError(500, err.message, 500);
    console.log("Mail option", mailOptions);
    console.log("Email sent: " + info.response);
  });
};
