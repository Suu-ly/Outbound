"use server";
import sgMail from "@sendgrid/mail";

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!process.env.SENDGRID_SECRET) {
    throw new Error("SENDGRID_SECRET environment variable is not set");
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM environment variable is not set");
  }

  sgMail.setApiKey(process.env.SENDGRID_SECRET);

  const message = {
    to: to.toLowerCase().trim(),
    from: process.env.EMAIL_FROM,
    subject: subject.trim(),
    text: text.trim(),
    html: html.trim(),
  };

  return sgMail.send(message).then(
    () => {},
    (error) => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    },
  );
}
