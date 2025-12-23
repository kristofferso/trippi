import { Resend, type CreateEmailOptions } from "resend";

type SendEmailArgs = {
  to: string;
  subject: string;
  react: React.ReactNode;
  from?: string;
  replyTo?: string;
};

export async function resendSendEmail(args: SendEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const from = args.from ?? process.env.RESEND_FROM;
  if (!from) throw new Error("RESEND_FROM is not set");

  const resend = new Resend(apiKey);

  const payload: CreateEmailOptions = {
    from,
    to: args.to,
    subject: args.subject,
    react: args.react,
    ...(args.replyTo ? { replyTo: args.replyTo } : {}),
  };

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    throw new Error(
      `Resend error: ${
        typeof error.message === "string"
          ? error.message
          : JSON.stringify(error)
      }`
    );
  }

  return data as { id?: string } | null;
}
