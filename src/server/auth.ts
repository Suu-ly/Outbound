import { db } from "@/server/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { config } from "dotenv";
import * as schema from "./db/schema";
import { sendEmail } from "./send-email";

config({ path: ".env" });

if (!process.env.GITHUB_CLIENT_ID) {
  throw new Error("GITHUB_CLIENT_ID environment variable is not set");
}
if (!process.env.GITHUB_CLIENT_SECRET) {
  throw new Error("GITHUB_CLIENT_SECRET environment variable is not set");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300, // Cache duration in seconds
    },
    freshAge: 0,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    autoSignInAfterVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Forgot your password?
        No worries, we got you.
        Just click the link below to reset your password.
        ${url}
        If you did not request this email, don’t worry, you can safely ignore it.
        Github ( https://github.com/Suu-ly/Outbound )`,
        html: `<table width="100%" height="100%" border="0" cellspacing="0" cellpadding="0" lang="en">
                <tbody>
                  <tr height="32" style="height:32px"><td></td></tr>
                  <tr align="center">
                    <td>
                      <table
                        border="0"
                        cellspacing="0"
                        cellpadding="0"
                        style="padding-bottom:24px;max-width:512px;min-width:220px"
                      >
                        <tbody>
                          <tr>
                            <td>
                              <div
                                style="border-style:solid;border-width:2px;border-color:#e2e8f0;border-radius:16px;padding:24px"
                                align="center"
                              >
                                <img
                                  src="http://cdn.mcauto-images-production.sendgrid.net/8e76061d0293c92a/2c3375a0-c7b4-4410-b690-3cbf0076c2b6/152x40.png"
                                  width="152"
                                  height="40"
                                  aria-hidden="true"
                                  style="margin-bottom:24px"
                                  alt="Outbound"
                                />
                                <div style="font-family:Arial,sans-serif;font-size:36px;font-weight:700;line-height:40px;text-align:center;word-break:break-word;color:#0F172A;margin-bottom:24px;">
                                  Forgot your password?
                                </div>
                                <div style="font-family:Arial,sans-serif;font-family: Arial;font-size:16px;font-weight:400;line-height:24px;text-align:center;word-break:break-word;color:#334155;margin-bottom:24px;">
                                  No worries, we got you. 
                                  <br/>
                                  Just click the button below to reset your password.
                                </div>
                                <div style="text-align:center;margin-bottom:24px;">
                                  <a href="${url}" style="padding:12px 24px;height:48px;border-width:2px;border-style:solid;border-color:#0F172A;border-radius:32px;background-color:#106CAE;color:#FAFAFA;font-size:16px;font-weight:500;line-height:48px;text-decoration:none">Reset Password</a>
                                </div>
                                <div style="font-family:Arial,sans-serif;font-size:12px;font-weight:400;line-height:16px;text-align:center;word-break:break-word;color:#64748B;margin-bottom:6px;">
                                  If you did not request this email, don’t worry, you can safely ignore it.
                                </div>
                                <div>
                                  <a href="https://github.com/Suu-ly/Outbound" target="_blank" style="font-family:Arial,sans-serif;font-size:12px;font-weight:400;line-height:16px;text-align:center;word-break:break-word;color:#64748B;">
                                    Github
                                  </a>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>`,
      });
    },
  },

  emailVerification: {
    autoSignInAfterVerification: true,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    // OTP_EXPIRED: "otp expired",
    // INVALID_OTP: "invalid otp",
    // INVALID_EMAIL: "invalid email",
    // USER_NOT_FOUND: "user not found",
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "email-verification") {
          await sendEmail({
            to: email,
            subject: "Verify your email",
            text: `Verify your email 
            Use the code below to verify your email and start planning your trips the fun way! 
            The code will be valid for 10 minutes. 
            ${otp} 
            If you did not request this email, don’t worry, you can safely ignore it. 
            Github ( https://github.com/Suu-ly/Outbound )`,
            html: `<table width="100%" height="100%" border="0" cellspacing="0" cellpadding="0" lang="en">
                    <tbody>
                      <tr height="32" style="height:32px"><td></td></tr>
                      <tr align="center">
                        <td>
                          <table
                            border="0"
                            cellspacing="0"
                            cellpadding="0"
                            style="padding-bottom:24px;max-width:512px;min-width:220px"
                          >
                            <tbody>
                              <tr>
                                <td>
                                  <div
                                    style="border-style:solid;border-width:2px;border-color:#e2e8f0;border-radius:16px;padding:24px"
                                    align="center"
                                  >
                                    <img
                                      src="http://cdn.mcauto-images-production.sendgrid.net/8e76061d0293c92a/2c3375a0-c7b4-4410-b690-3cbf0076c2b6/152x40.png"
                                      width="152"
                                      height="40"
                                      aria-hidden="true"
                                      style="margin-bottom:24px"
                                      alt="Outbound"
                                    />
                                    <div style="font-family:Arial,sans-serif;font-size:36px;font-weight:700;line-height:40px;text-align:center;word-break:break-word;color:#0F172A;margin-bottom:24px;">
                                      Verify your email
                                    </div>
                                    <div style="font-family:Arial,sans-serif;font-family: Arial;font-size:16px;font-weight:400;line-height:24px;text-align:center;word-break:break-word;color:#334155;margin-bottom:24px;">
                                      Use the code below to verify your email and start planning your trips the fun way! 
                                      <br />
                                      The code will be valid for 10 minutes.
                                    </div>
                                    <div style="text-align:center;font-size:36px;font-weight:700;line-height:40px;padding-top:32px;padding-bottom:32px;border-radius:12px;background-color:#F8FAFC;margin-bottom:12px">
                                      ${otp}
                                    </div>
                                    <div style="font-family:Arial,sans-serif;font-size:12px;font-weight:400;line-height:16px;text-align:center;word-break:break-word;color:#64748B;margin-bottom:6px;">
                                      If you did not request this email, don’t worry, you can safely ignore it.
                                    </div>
                                    <div>
                                      <a href="https://github.com/Suu-ly/Outbound" target="_blank" style="font-family:Arial,sans-serif;font-size:12px;font-weight:400;line-height:16px;text-align:center;word-break:break-word;color:#64748B;">
                                        Github
                                      </a>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>`,
          });
        }
      },
      expiresIn: 600,
      sendVerificationOnSignUp: true,
      disableSignUp: true,
    }),
    nextCookies(),
  ],
});
