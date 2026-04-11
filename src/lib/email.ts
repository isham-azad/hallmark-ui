import nodemailer from "nodemailer";

/**
 * Email Service Helper
 * Configured for Hostinger SMTP (care@hallmarkworld.com)
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true, // Use SSL for port 465
    auth: {
        user: process.env.SMTP_USER || "care@hallmarkworld.com",
        pass: process.env.SMTP_PASS, // This MUST be set in environment variables
    },
});

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }): Promise<boolean> {
    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction && !process.env.SMTP_PASS) {
        console.log("------------------------------------------");
        console.log(`[LOCAL DEV] EMAIL TO: ${to}`);
        console.log(`[LOCAL DEV] SUBJECT: ${subject}`);
        console.log(`[LOCAL DEV] HTML: (Length ${html.length} characters)`);
        console.log("------------------------------------------");
        return true;
    }

    if (!process.env.SMTP_PASS) {
        console.error("SMTP_PASS is missing in environment variables.");
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"HallMark" <${process.env.SMTP_USER || "care@hallmarkworld.com"}>`,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error("Error sending email via Hostinger SMTP:", error);
        return false;
    }
}

export async function sendOrderConfirmationEmail(orderData: any) {
    const { orderNo, customer, email, total, items, paymentMethod } = orderData;

    const itemsHtml = items.map((item: any) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">
                <p style="margin: 0; font-weight: 600; color: #2d3748;">${item.name}</p>
                <p style="margin: 0; font-size: 12px; color: #718096;">Qty: ${item.qty} × ${item.price}</p>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right; vertical-align: middle;">
                <span style="font-weight: 600; color: #2d3748;">${item.price}</span>
            </td>
        </tr>
    `).join("");

    const subject = `Order Confirmed: ${orderNo} - HallMark`;
    const html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; color: white;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="left" style="vertical-align: middle;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">Order Placed!</h1>
                            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Thank you for shopping with HallMark</p>
                        </td>
                        <td align="right" style="vertical-align: middle;">
                            <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566375/hallmark/assets/img/logo-white.png" alt="HallMark Logo" style="width: 120px; height: auto; display: block;" />
                        </td>
                    </tr>
                </table>
            </div>
            
            <div style="padding: 30px;">
                <div style="margin-bottom: 30px;">
                    <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 15px; font-weight: 700;">Hi ${customer},</h2>
                    <p style="color: #475569; line-height: 1.6; margin: 0;">We've received your order <strong>${orderNo}</strong> and it's being processed. We'll notify you once it's on its way.</p>
                </div>

                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 15px; font-weight: 600;">Order Summary</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${itemsHtml}
                        <tr>
                            <td style="padding: 20px 10px 10px; font-weight: 700; color: #0f172a; font-size: 18px;">Total Amount</td>
                            <td style="padding: 20px 10px 10px; text-align: right; font-weight: 800; color: #166534; font-size: 20px;">${total}</td>
                        </tr>
                    </table>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;">
                        <p style="margin: 0 0 5px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Payment Method</p>
                        <p style="margin: 0; color: #0f172a; font-weight: 600;">${paymentMethod}</p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">If you have any questions, reply to this email or contact us at care@hallmarkworld.com</p>
                    <div style="padding-top: 20px; border-top: 1px solid #f1f5f9;">
                        <p style="margin: 0; color: #64748b; font-size: 12px;">&copy; 2026 HallMark World. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
}

export async function sendVoucherEmail(email: string, clientName: string, voucherCode: string, amount: number) {
    const subject = `Your HallMark E-Gift Voucher: ${voucherCode}`;
    const html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
             <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 30px; color: white;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="left" style="vertical-align: middle;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Congratulations!</h1>
                            <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Your E-Gift Voucher is Ready</p>
                        </td>
                        <td align="right" style="vertical-align: middle;">
                            <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566375/hallmark/assets/img/logo-white.png" alt="HallMark Logo" style="width: 100px; height: auto; display: block;" />
                        </td>
                    </tr>
                </table>
            </div>

            <div style="padding: 30px;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Hi ${clientName},</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">Your reward point redemption request has been completed successfully. We are excited to present you with your HallMark E-Gift Voucher.</p>
                
                <div style="background: #f8fafc; border: 2px dashed #ffc451; padding: 30px; text-align: center; border-radius: 16px; margin: 30px 0;">
                    <span style="display: block; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; font-weight: 600;">Gift Voucher Value</span>
                    <span style="display: block; color: #166534; font-size: 36px; font-weight: 800; margin-bottom: 25px;">₹${amount.toLocaleString()}</span>
                    
                    <span style="display: block; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; font-weight: 600;">Voucher Code</span>
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 15px 25px; border-radius: 12px; display: inline-block; box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
                        <code style="font-family: ui-monospace, monospace; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: 0.05em;">${voucherCode}</code>
                    </div>
                </div>
                
                <div style="background: #fffbeb; border-radius: 12px; padding: 20px; border: 1px solid #fde68a; margin-bottom: 30px;">
                    <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                        <strong>How to use:</strong> Simply enter this code at the checkout under the <strong>"Gift Voucher"</strong> section when placing your next B2B order.
                    </p>
                </div>
                
                <p style="color: #64748b; font-size: 13px; text-align: center;">This voucher is valid for 1 year from the date of issue.</p>
                
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">&copy; 2026 HallMark World. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
}

