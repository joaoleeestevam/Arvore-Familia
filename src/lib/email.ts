import "server-only";
import nodemailer from "nodemailer";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transport = getTransport();

  if (!transport) {
    // Sem SMTP configurado (.env): registra no log do servidor para uso local,
    // em vez de falhar silenciosamente.
    console.log("=".repeat(60));
    console.log("EMAIL NÃO ENVIADO — configure SMTP_HOST/PORT/USER/PASSWORD no .env");
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log(html);
    console.log("=".repeat(60));
    return { sent: false as const };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  await transport.sendMail({ from, to, subject, html });
  return { sent: true as const };
}
