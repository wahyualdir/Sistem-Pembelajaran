import React from "react";
import { getSession } from "@/lib/auth/session";
import { KrsStore } from "@/features/krs/krs-store";
import { Badge } from "@/components/ui/badge";
import { RetroWindow } from "@/components/retro/retro-window";
import { Calendar, Clock, MapPin, User, CalendarDays } from "lucide-react";

export default async function MahasiswaJadwalPage() {
  const session = await getSession();
  const mahasiswaId = session?.subId || "mhs-1";
  const krs = KrsStore.getKrsByMahasiswa(mahasiswaId);

  const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  const schedulesByDay: Record<
    string,
    {
      mataKuliah: string;
      kelas: string;
      sks: number;
      dosen: string;
      jamMulai: string;
      jamSelesai: string;
      ruang: string;
    }[]
  > = {
    Senin: [],
    Selasa: [],
    Rabu: [],
    Kamis: [],
    Jumat: [],
    Sabtu: [],
  };

  for (const item of krs.items) {
    for (const j of item.kelas.jadwal) {
      if (schedulesByDay[j.hari]) {
        schedulesByDay[j.hari].push({
          mataKuliah: item.kelas.namaMataKuliah,
          kelas: item.kelas.kode,
          sks: item.kelas.sks,
          dosen: item.kelas.namaDosen,
          jamMulai: j.jamMulai,
          jamSelesai: j.jamSelesai,
          ruang: j.namaRuang,
        });
      }
    }
  }

  for (const day of days) {
    schedulesByDay[day].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
  }

  const totalClasses = Object.values(schedulesByDay).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="w-full space-y-6">
      {/* Retro Window Header */}
      <RetroWindow
        title="siakad://jadwal.mingguan"
        badge="Semester 2026/2027 Ganjil"
        actions={
          <span className="text-sm font-bold text-primary">
            {totalClasses} Kelas Terjadwal
          </span>
        }
      >
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-6 w-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-black text-foreground font-heading tracking-tight">
                Jadwal Perkuliahan Mingguan
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mt-1.5 font-normal">
              Kalender jadwal kegiatan tatap muka perkuliahan terintegrasi sesuai KRS semester berjalan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-4 py-1.5 rounded-md border-2 border-retro-border bg-retro-warm text-foreground text-sm font-bold shadow-xs">
              Aktif: 6 Hari Kuliah
            </span>
          </div>
        </div>
      </RetroWindow>

      {/* Grid Kalender Mingguan Visual */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {days.map((day) => {
          const list = schedulesByDay[day];
          return (
            <div
              key={day}
              className="flex flex-col rounded-lg border-2 border-retro-border bg-retro-surface shadow-retro overflow-hidden transition-all hover:-translate-y-0.5"
            >
              {/* Header Hari */}
              <div className="py-3 px-4 bg-retro-warm border-b-2 border-retro-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-retro-border bg-primary" />
                  <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                    {day}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground rounded-full border border-retro-border bg-retro-yellow px-3 py-1 shadow-xs">
                  {list.length} Kelas
                </span>
              </div>

              {/* Daftar Jadwal */}
              <div className="p-4 flex-1 space-y-3.5">
                {list.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Tidak ada jadwal perkuliahan hari {day}.
                  </div>
                ) : (
                  list.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border-2 border-retro-border p-3.5 space-y-2.5 bg-retro-bg hover:bg-retro-warm/40 transition-colors shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <h4 className="font-bold text-sm sm:text-base text-foreground leading-snug">
                          {item.mataKuliah}
                        </h4>
                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-retro-border bg-retro-mint text-foreground text-xs font-bold shrink-0">
                          {item.kelas}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">
                          {item.jamMulai} - {item.jamSelesai} WIB
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">{item.sks} SKS</span>
                      </div>

                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{item.ruang}</span>
                      </div>

                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2 pt-2 border-t border-retro-border/40">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{item.dosen}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
