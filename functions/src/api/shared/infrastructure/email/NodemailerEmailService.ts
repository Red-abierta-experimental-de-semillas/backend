import * as nodemailer from "nodemailer";
import type { EmailMessage, EmailService } from "../../application/EmailService";

export class NodemailerEmailService implements EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private readonly from: string;
    private readonly isConfigured: boolean;

    constructor() {
        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT || 587);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const secure = String(process.env.SMTP_SECURE || "false") === "true";

        this.from = process.env.SMTP_FROM || user || "noreply@red-experimental-semillas.web.app";
        this.isConfigured = Boolean(host && user && pass);

        if (this.isConfigured) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: { user, pass },
            });
        }
    }

    async send(message: EmailMessage): Promise<void> {
        if (!this.isConfigured || !this.transporter) {
            console.log("[email:dry-run]", {
                to: message.to,
                subject: message.subject,
                text: message.text,
            });
            return;
        }

        await this.transporter.sendMail({
            from: this.from,
            to: message.to,
            subject: message.subject,
            text: message.text,
            html: message.html,
        });
    }
}
