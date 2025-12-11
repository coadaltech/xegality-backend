interface SmsResponse {
  success: boolean;
  message?: string;
  error?: string;
  response?: string;
}

interface SmsParams {
  number: string;
  message: string;
}

export const sendSMS = async (params: SmsParams): Promise<SmsResponse> => {
  try {
    const {
      SMS_API_URL,
      SMS_AUTH_KEY,
      SMS_SENDER_ID,
      SMS_ROUTE,
      SMS_TEMPLATE_ID,
    } = process.env;

    if (
      !SMS_API_URL ||
      !SMS_AUTH_KEY ||
      !SMS_SENDER_ID ||
      !SMS_ROUTE ||
      !SMS_TEMPLATE_ID
    ) {
      console.error("[SMS Service] Missing required environment variables");
      return {
        success: false,
        error: "SMS service configuration missing",
      };
    }

    const url = new URL(SMS_API_URL);
    url.searchParams.append("authentic-key", SMS_AUTH_KEY);
    url.searchParams.append("senderid", SMS_SENDER_ID);
    url.searchParams.append("route", SMS_ROUTE);
    url.searchParams.append("number", params.number);
    url.searchParams.append("message", params.message);
    url.searchParams.append("templateid", SMS_TEMPLATE_ID);

    console.log(`[SMS Service] Sending OTP to ${params.number}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();
    console.log(`[SMS Service] API Response: ${responseText}`);

    // Parse response based on the SMS provider's format
    // Success responses include message-id or success indicators
    if (
      responseText.includes("msg-id") ||
      responseText.includes("Success") ||
      responseText.includes("sent")
    ) {
      return {
        success: true,
        message: "SMS sent successfully",
        response: responseText,
      };
    } else {
      return {
        success: false,
        error: responseText || "Failed to send SMS",
      };
    }
  } catch (error) {
    console.error("[SMS Service] Error sending SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const generateOTPSmsMessage = (otp: number): string => {
  return `Dear Customer, your verification OTP is ${otp}. Please do not share it with anyone. - Xegality`;
};
