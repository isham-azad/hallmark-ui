/**
 * Email Service Helper
 * In production, you can use Resend, SendGrid, or any other email provider.
 * For now, this is a simulated service that logs emails in development.
 */

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }): Promise<boolean> {
    const isProduction = process.env.NODE_ENV === "production";
    const apiKey = process.env.EMAIL_SERVICE_API_KEY;

    if (!isProduction) {
        console.log("------------------------------------------");
        console.log(`[LOCAL DEV] EMAIL TO: ${to}`);
        console.log(`[LOCAL DEV] SUBJECT: ${subject}`);
        console.log(`[LOCAL DEV] HTML: (Length ${html.length} characters)`);
        console.log("------------------------------------------");
        return true;
    }

    if (!apiKey) {
        console.error("EMAIL_SERVICE_API_KEY is missing in production environment.");
        return false;
    }

    // Example using a generic fetch-based API like Resend
    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "HallMark <vouchers@hallmark.com>",
                to: [to],
                subject: subject,
                html: html,
            }),
        });

        const data = await response.json();
        return response.ok;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

export async function sendVoucherEmail(email: string, clientName: string, voucherCode: string, amount: number) {
    const subject = `Your HallMark E-Gift Voucher: ${voucherCode}`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; margin-top: 0;">Congratulations, ${clientName}!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your reward point redemption request has been completed successfully. We are excited to present you with your HallMark E-Gift Voucher.</p>
            
            <div style="background: #f8fafc; border: 2px dashed #ffc451; padding: 30px; text-align: center; border-radius: 16px; margin: 30px 0;">
                <span style="display: block; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">Gift Voucher Value</span>
                <span style="display: block; color: #166534; font-size: 36px; font-weight: 800; margin-bottom: 20px;">₹${amount.toLocaleString()}</span>
                
                <span style="display: block; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">Voucher Code</span>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; display: inline-block;">
                    <code style="font-family: monospace; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: 0.05em;">${voucherCode}</code>
                </div>
            </div>
            
            <p style="color: #475569; font-size: 14px; line-height: 1.6;"><strong>How to use:</strong> Simply enter this code at the checkout under the "Gift Voucher" section when placing your next B2B order.</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">This voucher is valid for 1 year from the date of issue.</p>
            
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-bottom: 0;">&copy; 2026 HallMark. All rights reserved.</p>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
}
