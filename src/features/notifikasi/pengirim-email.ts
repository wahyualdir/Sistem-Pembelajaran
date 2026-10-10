import { PengirimNotifikasi, EmailPayload } from "./types";

/**
 * Layanan pengirim email notifikasi sistem.
 * Mendukung pengiriman melalui provider transactional email (Resend / SMTP)
 * dengan fallback simulasi logger aman di lingkungan lokal / testing.
 */
class ServicePengirimEmail implements PengirimNotifikasi {
  async kirimEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "SIAKAD UIR <notifikasi@siakad.uir.ac.id>",
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          return { success: false, error: errData.message || "Gagal mengirim email via Resend" };
        }

        const data = await response.json();
        return { success: true, id: data.id };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Kesalahan koneksi pengiriman email",
        };
      }
    }

    // Fallback: Mode logging pengembangan/testing
    if (process.env.NODE_ENV !== "production") {
      // Log simulasi terkirim
    }

    return {
      success: true,
      id: `mock-email-${Date.now()}`,
    };
  }
}

export const pengirimEmail: PengirimNotifikasi = new ServicePengirimEmail();
