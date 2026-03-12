export async function sendSmsOtp(phone: string, otp: string): Promise<boolean> {
    const apiKey = process.env.FAST2SMS_API_KEY;
    const apiUrl = process.env.FAST2SMS_API_URL;

    if (!apiKey) {
        console.warn("FAST2SMS_API_KEY is not configured. Simulating SMS to " + phone + " with OTP " + otp);
        return true; // Simulate success if no key for local dev
    }

    try {
        const response = await fetch(apiUrl!, {
            method: "POST",
            headers: {
                "authorization": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                route: "q",
                message: `Your OTP is ${otp}`,
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
