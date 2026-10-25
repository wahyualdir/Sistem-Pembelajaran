import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { DokumenKhsPdf } from "@/lib/pdf/dokumen-khs";
import { NilaiStore } from "@/features/nilai/nilai-store";
import { MasterStore } from "@/features/master/master-store";
import { authorizeAcademicStudentAccess } from "@/lib/auth/pdf-access";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mahasiswaId = searchParams.get("mhsId") || "mhs-1";
    const semesterKode = searchParams.get("semester") || undefined;

    // Verifikasi otentikasi & cegah IDOR
    const authCheck = await authorizeAcademicStudentAccess(mahasiswaId);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 403 }
      );
    }

    const khsData = NilaiStore.getKhsMahasiswa(mahasiswaId, semesterKode);

    if (!khsData.mahasiswa) {
      return NextResponse.json({ error: "Data mahasiswa tidak ditemukan" }, { status: 404 });
    }

    const prodi =
      MasterStore.getProdi().find((p) => p.id === khsData.mahasiswa?.prodiId)?.nama ||
      "Teknik Informatika";
    const dosenWali =
      MasterStore.getDosen().find((d) => d.id === khsData.mahasiswa?.dosenWaliId)?.nama ||
      "Dr. Ardiansyah, S.T., M.Kom.";

    const today = new Date();
    const dateFormatted = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const nomorDokumen = `KHS/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${khsData.mahasiswa.nim}`;

    const pdfElement = React.createElement(DokumenKhsPdf, {
      nomorDokumen,
      tanggalCetak: dateFormatted,
      mahasiswa: {
        nim: khsData.mahasiswa.nim,
        nama: khsData.mahasiswa.nama,
        prodi,
        angkatan: khsData.mahasiswa.angkatan,
        dosenWali,
      },
      tahunAjaranKode: khsData.tahunAjaranKode,
      daftarNilai: khsData.daftarNilai,
      totalSks: khsData.totalSks,
      ips: khsData.ips,
    }) as unknown as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="KHS_${khsData.mahasiswa.nim}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mencetak dokumen KHS" },
      { status: 500 }
    );
  }
}
