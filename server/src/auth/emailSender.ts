import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let gmailTransporter: Transporter | undefined;

function getGmailTransporter(): Transporter {
  const user = process.env.GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!user || !appPassword) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set in the server environment.');
  }

  if (!gmailTransporter) {
    gmailTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: appPassword },
    });
  }

  return gmailTransporter;
}

export async function sendResetPasswordEmail(to: string, resetUrl: string): Promise<void> {
  const user = process.env.GMAIL_USER!;
  const transporter = getGmailTransporter();
  await transporter.sendMail({
    from: `GaBakery <${user}>`,
    to,
    subject: 'Възстановяване на паролата за GaBakery',
    text: `Получихме заявка за промяна на паролата ви. Отворете този линк в рамките на един час: ${resetUrl}\n\nАко не сте заявили промяна, можете да игнорирате този имейл.`,
    html: `<p>Получихме заявка за промяна на паролата ви.</p><p><a href="${resetUrl}">Задайте нова парола</a></p><p>Линкът е валиден един час. Ако не сте заявили промяна, можете да игнорирате този имейл.</p>`,
  });
}
