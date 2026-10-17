/**
 * Adapter WhatsApp Gateway (Opsional)
 * Sesuai spesifikasi: Antarmuka dengan implementasi kosong (no-op)
 * dan konfigurasi melalui environment variable (WHATSAPP_API_URL, WHATSAPP_API_TOKEN).
 * Tidak melakukan hardcode kunci rahasia dan tidak mengikat ke penyedia berbayar tertentu.
 */

export interface WhatsAppSendResult {
  success: boolean;
  simulated: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppAdapter {
  sendMessage(phoneNumber: string, messageText: string): Promise<WhatsAppSendResult>;
}

export class NoOpWhatsAppAdapter implements WhatsAppAdapter {
  private apiUrl: string | undefined;
  private apiToken: string | undefined;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL;
    this.apiToken = process.env.WHATSAPP_API_TOKEN;
  }

  async sendMessage(phoneNumber: string, messageText: string): Promise<WhatsAppSendResult> {
    // Jika environment variable belum diatur, lewati secara aman tanpa error
    if (!this.apiUrl || !this.apiToken) {
      return {
        success: true,
        simulated: true,
        messageId: `sim_wa_${Date.now()}`,
      };
    }

    // Implementasi no-op aman (bisa dikaitkan ke gateway kampus internal via fetch jika env disiapkan)
    try {
      // Implementasi kosong yang aman, tidak memanggil API berbayar eksternal
      return {
        success: true,
        simulated: true,
        messageId: `noop_wa_${Date.now()}`,
      };
    } catch (err: any) {
      return {
        success: false,
        simulated: false,
        error: err?.message || 'Gagal mengirim pesan WhatsApp via adapter',
      };
    }
  }
}

export const defaultWhatsAppAdapter: WhatsAppAdapter = new NoOpWhatsAppAdapter();
