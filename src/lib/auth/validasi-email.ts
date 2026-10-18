/**
 * Validasi domain email student di sisi server
 * Aturan sesuai Bab IV Dokumen Perencanaan SIAKAD:
 * 1. Domain harus persis sama dengan ALLOWED_EMAIL_DOMAIN
 * 2. Subdomain palsu (misal student.uir.ac.id.attacker.com) atau awalan subdomain ditolak
 * 3. Case-insensitive (huruf besar/kecil disetarakan)
 * 4. Email harus sudah berstatus terverifikasi dari provider Google
 */

export interface ValidasiEmailParams {
  email: string | null | undefined;
  emailVerified: boolean | null | undefined;
  allowedDomain?: string;
  allowedDomains?: string[] | string;
}

export interface ValidasiEmailResult {
  valid: boolean;
  pesanError?: string;
  normalizedEmail?: string;
}

export function validasiEmailStudent({
  email,
  emailVerified,
  allowedDomain,
  allowedDomains = allowedDomain ||
    process.env.ALLOWED_EMAIL_DOMAINS ||
    process.env.ALLOWED_EMAIL_DOMAIN ||
    "student.uir.ac.id",
}: ValidasiEmailParams): ValidasiEmailResult {
  if (!email || typeof email !== "string") {
    return {
      valid: false,
      pesanError: "Alamat email tidak valid atau kosong.",
    };
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Pastikan email terverifikasi dari Google OAuth
  if (!emailVerified) {
    return {
      valid: false,
      pesanError: "Alamat email Google belum diverifikasi.",
    };
  }

  // Format RFC 5322 sederhana untuk pemisahan user dan domain
  const parts = trimmedEmail.split("@");
  if (parts.length !== 2) {
    return {
      valid: false,
      pesanError: "Format alamat email tidak valid.",
    };
  }

  const [username, domain] = parts;
  if (!username || !domain) {
    return {
      valid: false,
      pesanError: "Bagian username atau domain email tidak boleh kosong.",
    };
  }

  const validDomainList: string[] = (
    Array.isArray(allowedDomains)
      ? allowedDomains
      : allowedDomains.split(",")
  )
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  // Pencocokan persis domain (menolak subdomain seperti attacker.student.uir.ac.id atau student.uir.ac.id.evil.com)
  if (!validDomainList.includes(domain)) {
    return {
      valid: false,
      pesanError: `Gunakan email student kampus (@${validDomainList.join(
        " atau @"
      )}) untuk masuk.`,
    };
  }

  return {
    valid: true,
    normalizedEmail: `${username}@${domain}`,
  };
}

/**
 * Validasi email multi-domain dan allowlist dari basis data
 */
export async function validasiEmailKampusAsync({
  email,
  emailVerified,
}: {
  email: string | null | undefined;
  emailVerified: boolean | null | undefined;
}): Promise<ValidasiEmailResult> {
  if (!email || typeof email !== 'string') {
    return { valid: false, pesanError: 'Alamat email tidak valid atau kosong.' };
  }
  if (!emailVerified) {
    return { valid: false, pesanError: 'Alamat email Google belum diverifikasi.' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, pesanError: 'Format alamat email tidak valid.' };
  }
  const [username, domain] = parts;
  if (!username || !domain) {
    return { valid: false, pesanError: 'Bagian username atau domain email tidak boleh kosong.' };
  }

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    // 1. Cek allowlist spesifik
    const { data: allowlistMatch, error: err1 } = await supabase
      .from('email_allowlist')
      .select('id')
      .eq('email', trimmedEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (allowlistMatch) {
      return { valid: true, normalizedEmail: trimmedEmail };
    }

    // 2. Cek domain yang diizinkan di tabel allowed_email_domains
    const { data: domainMatch, error: err2 } = await supabase
      .from('allowed_email_domains')
      .select('id')
      .eq('domain', domain)
      .eq('is_active', true)
      .maybeSingle();

    if (domainMatch) {
      return { valid: true, normalizedEmail: trimmedEmail };
    }

    // Jika koneksi tabel database berhasil dan tidak cocok di kedua tabel, tolak secara tegas
    if (!err1 && !err2) {
      return {
        valid: false,
        pesanError: `Domain email @${domain} atau alamat surel tidak diizinkan untuk masuk. Gunakan domain institusi resmi.`,
      };
    }
  } catch {
    // Fallback saat offline/unit test tanpa koneksi database
  }

  return validasiEmailStudent({
    email,
    emailVerified,
    allowedDomains: ['student.uir.ac.id', 'dosen.uir.ac.id', 'uir.ac.id', 'siakad.uir.ac.id'],
  });
}

