import React from 'react';

interface LoginDevModeProps {
  onSelectIdentifier: (id: string) => void;
}

const DEMO_ACCOUNTS = [
  { role: 'Mahasiswa', desc: 'NIM 243510001', id: '243510001' },
  { role: 'Asisten Dosen / Lab', desc: 'NIM 243510002', id: '243510002' },
  { role: 'Dosen & Wali', desc: 'NIDN 0012345678', id: '0012345678' },
  { role: 'Kaprodi', desc: 'NIDN 0087654321', id: '0087654321' },
  { role: 'Sekretaris Prodi', desc: 'NIDN 0011223344', id: '0011223344' },
  { role: 'Kepala Lab', desc: 'NIDN 0022334455', id: '0022334455' },
  { role: 'Staf Akademik', desc: 'NIP 198501012010121001', id: '198501012010121001' },
  { role: 'System Admin', desc: 'sysadmin', id: 'sysadmin' },
  { role: 'Super Admin', desc: 'NIP 20120009', id: '20120009' },
] as const;

export function LoginDevMode({ onSelectIdentifier }: LoginDevModeProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <details
      data-testid="dev-mode-details"
      className="mt-8 pt-4 border-t border-[#8A8577]/30 text-xs text-[#4A473F] group"
    >
      <summary className="cursor-pointer font-medium hover:text-[#1C1B19] select-none list-none flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B44A2F] rounded p-1 min-h-[44px]">
        <span className="inline-block transition-transform duration-150 group-open:rotate-90">
          ▶
        </span>
        <span>Mode pengembang</span>
      </summary>
      <div className="mt-3 space-y-2 p-3 rounded-[10px] bg-[#FFFFFF] border border-[#8A8577]/40">
        <p className="text-[11px] text-[#4A473F]">
          Klik untuk mengisi identitas tanpa mengisi kata sandi (hanya tersedia di mode pengembangan):
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => onSelectIdentifier(acc.id)}
              className="p-2 rounded-[8px] border border-[#8A8577]/40 bg-[#F6F2EA] hover:bg-[#FFFFFF] hover:border-[#B44A2F] text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B44A2F] min-h-[44px]"
            >
              <span className="block font-semibold text-[11px] text-[#1C1B19] truncate">
                {acc.role}
              </span>
              <span className="block font-mono text-[10px] text-[#4A473F] truncate">
                {acc.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}
