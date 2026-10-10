import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { DokumenSuratPdf } from "@/lib/pdf/dokumen-surat";
import { SuratStore } from "@/features/surat/surat-store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const suratId = searchParams.get("id");

    if (!suratId) {
      return NextResponse.json({ error: "Parameter ID surat diperlukan" }, { status: 400 });
    }

    const surat = SuratStore.getPengajuanById(suratId);
    if (!surat) {
      return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
    }

    if (surat.status !== "DISETUJUI") {
      return NextResponse.json(
        { error: "Surat belum dapat diunduh karena belum disetujui oleh admin." },
        { status: 403 }
      );
    }

    const today = new Date();
    const dateFormatted = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const pdfElement = React.createElement(DokumenSuratPdf, {
      surat,
      tanggalCetak: dateFormatted,
    }) as unknown as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Surat_${surat.nim}_${surat.jenis}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal menerbitkan surat PDF" },
      { status: 500 }
    );
  }
}
