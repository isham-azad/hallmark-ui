export async function sendSms(phone: string, message: string): Promise<boolean> {
    const isProduction = process.env.NODE_ENV === "production";
    const apiKey = process.env.FAST2SMS_API_KEY;
    const apiUrl = process.env.FAST2SMS_API_URL || "https://www.fast2sms.com/dev/bulkV2";

    if (!isProduction) {
        console.log("------------------------------------------");
        console.log(`[LOCAL DEV] SMS TO: ${phone}`);
        console.log(`[LOCAL DEV] MESSAGE: ${message}`);
        console.log("------------------------------------------");
        return true;
    }

    if (!apiKey) {
        console.error("FAST2SMS_API_KEY is missing in production environment.");
        return false;
    }

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "authorization": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                route: "q",
                message: message,
                numbers: phone
            })
        });

        const data = await response.json();

        if (data.return === true) {
            return true;
        } else {
            console.error("Fast2SMS API Error:", data);
            return false;
        }
    } catch (error) {
        console.error("Error sending SMS via Fast2SMS:", error);
        return false;
    }
}

export async function sendSmsOtp(phone: string, otp: string): Promise<boolean> {
    return sendSms(phone, `Your OTP Is ${otp}`);
}
