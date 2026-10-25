import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { DokumenTranskripPdf } from "@/lib/pdf/dokumen-transkrip";
import { NilaiStore } from "@/features/nilai/nilai-store";
import { MasterStore } from "@/features/master/master-store";
import { authorizeAcademicStudentAccess } from "@/lib/auth/pdf-access";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mahasiswaId = searchParams.get("mhsId") || "mhs-1";

    // Verifikasi otentikasi & cegah IDOR
    const authCheck = await authorizeAcademicStudentAccess(mahasiswaId);
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status || 403 }
      );
    }

    const transkripData = NilaiStore.getTranskripMahasiswa(mahasiswaId);

    if (!transkripData.mahasiswa) {
      return NextResponse.json({ error: "Data mahasiswa tidak ditemukan" }, { status: 404 });
    }

    const prodi =
      MasterStore.getProdi().find((p) => p.id === transkripData.mahasiswa?.prodiId)?.nama ||
      "Teknik Informatika";

    const today = new Date();
    const dateFormatted = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const nomorDokumen = `TRA/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${transkripData.mahasiswa.nim}`;

    const pdfElement = React.createElement(DokumenTranskripPdf, {
      nomorDokumen,
      tanggalCetak: dateFormatted,
      mahasiswa: {
        nim: transkripData.mahasiswa.nim,
        nama: transkripData.mahasiswa.nama,
        prodi,
        jenjang: "S1",
        angkatan: transkripData.mahasiswa.angkatan,
      },
      daftarMataKuliah: transkripData.daftarMataKuliah,
      totalSksDitempuh: transkripData.totalSksDitempuh,
      totalSksLulus: transkripData.totalSksLulus,
      ipk: transkripData.ipk,
    }) as unknown as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Transkrip_${transkripData.mahasiswa.nim}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal mencetak dokumen Transkrip" },
      { status: 500 }
    );
  }
}
