import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { DokumenKartuUjianPdf } from "@/lib/pdf/dokumen-kartu-ujian";
import { UjianStore, JenisUjian } from "@/features/ujian/ujian-store";
import { MasterStore } from "@/features/master/master-store";
import { SEED_TAHUN_AJARAN } from "@/lib/db/seed-data";
import { authorizeAcademicStudentAccess } from "@/lib/auth/pdf-access";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mahasiswaId = searchParams.get("mhsId") || "mhs-1";
    const jenis = (searchParams.get("jenis") || "UTS") as JenisUjian;

    // Verifikasi otentikasi & cegah IDOR
    const authCheck = await authorizeAcademicStudentAccess(mahasiswaId);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 403 }
      );
    }

    // Evaluasi 3 Syarat Kelayakan Kartu Ujian (Bab 6.6)
    const evaluasi = UjianStore.evaluasiKartuUjianMahasiswa(mahasiswaId);
    if (!evaluasi.layak) {
      return NextResponse.json(
        {
          error: "Kartu ujian belum dapat diterbitkan karena syarat akademik belum terpenuhi.",
          alasan: evaluasi.alasanTidakLayak,
        },
        { status: 403 }
      );
    }

    const mhs = MasterStore.getMahasiswaById(mahasiswaId);
    if (!mhs) {
      return NextResponse.json({ error: "Data mahasiswa tidak ditemukan" }, { status: 404 });
    }

    const prodi =
      MasterStore.getProdi().find((p) => p.id === mhs.prodiId)?.nama || "Teknik Informatika";
    const dosenWali =
      MasterStore.getDosen().find((d) => d.id === mhs.dosenWaliId)?.nama ||
      "Dr. Ardiansyah, S.T., M.Kom.";

    const jadwalList = UjianStore.getJadwalMahasiswa(mahasiswaId, jenis);

    const today = new Date();
    const dateFormatted = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const nomorDokumen = `KPU/${jenis}/${today.getFullYear()}/${mhs.nim}`;

    const pdfElement = React.createElement(DokumenKartuUjianPdf, {
      nomorDokumen,
      tanggalCetak: dateFormatted,
      jenisUjian: jenis,
      tahunAjaranKode: `${SEED_TAHUN_AJARAN.kode} ${SEED_TAHUN_AJARAN.semester}`,
      mahasiswa: {
        nim: mhs.nim,
        nama: mhs.nama,
        prodi,
        angkatan: mhs.angkatan,
        dosenWali,
      },
      jadwalList,
    }) as unknown as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Kartu_${jenis}_${mhs.nim}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menerbitkan kartu ujian" },
      { status: 500 }
    );
  }
}
