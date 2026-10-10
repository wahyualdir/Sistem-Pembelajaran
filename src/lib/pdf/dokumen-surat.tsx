import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { PengajuanSuratItem } from "@/features/surat/surat-store";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#101828",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.6,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#2A4DB7",
    paddingBottom: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: "#2A4DB7",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerTextContainer: {
    flex: 1,
  },
  instansiTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2A4DB7",
    letterSpacing: 0.5,
  },
  instansiSub: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#101828",
    marginTop: 2,
  },
  instansiAddress: {
    fontSize: 8.5,
    color: "#667085",
    marginTop: 2,
  },
  documentTitleContainer: {
    textAlign: "center",
    marginBottom: 24,
  },
  documentTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#101828",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textDecoration: "underline",
  },
  documentNo: {
    fontSize: 9.5,
    color: "#101828",
    marginTop: 4,
    fontWeight: "bold",
  },
  paragraph: {
    fontSize: 10,
    color: "#101828",
    marginBottom: 14,
    textAlign: "justify",
  },
  biodataBox: {
    marginLeft: 24,
    marginBottom: 18,
  },
  biodataRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bioLabel: {
    width: 140,
    fontSize: 10,
    color: "#667085",
  },
  bioValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    color: "#101828",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 36,
  },
  signatureBox: {
    width: 220,
    textAlign: "center",
  },
  dateText: {
    fontSize: 9.5,
    color: "#101828",
    marginBottom: 4,
  },
  signTitle: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#101828",
    marginBottom: 50,
  },
  signName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#101828",
    textDecoration: "underline",
  },
  signNip: {
    fontSize: 8.5,
    color: "#667085",
    marginTop: 2,
  },
  stampBox: {
    marginTop: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 4,
    backgroundColor: "#F6F7F9",
  },
  stampText: {
    fontSize: 7.5,
    color: "#667085",
    textAlign: "center",
  },
});

export interface DokumenSuratPdfProps {
  surat: PengajuanSuratItem;
  tanggalCetak: string;
}

export function DokumenSuratPdf({ surat, tanggalCetak }: DokumenSuratPdfProps) {
  const judulSurat =
    surat.jenis === "AKTIF_KULIAH"
      ? "SURAT KETERANGAN AKTIF KULIAH"
      : surat.jenis === "CUTI_AKADEMIK"
      ? "SURAT KETERANGAN CUTI AKADEMIK"
      : "SURAT REKOMENDASI AKADEMIK";

  return (
    <Document title={`Surat_${surat.nomorSurat?.replace(/\//g, "_") || surat.id}`}>
      <Page size="A4" style={styles.page}>
        {/* Kop Surat */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>UIR</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.instansiTitle}>UNIVERSITAS ISLAM RIAU</Text>
            <Text style={styles.instansiSub}>FAKULTAS TEKNIK</Text>
            <Text style={styles.instansiAddress}>
              Jl. Kaharuddin Nasution No. 113, Pekanbaru, Riau 28284 | Telp: (0761) 674674 | Web: www.uir.ac.id
            </Text>
          </View>
        </View>

        {/* Judul & Nomor Surat */}
        <View style={styles.documentTitleContainer}>
          <Text style={styles.documentTitle}>{judulSurat}</Text>
          <Text style={styles.documentNo}>Nomor: {surat.nomorSurat || "DRAFT/SURAT"}</Text>
        </View>

        {/* Isi Surat */}
        <Text style={styles.paragraph}>
          Dekan Fakultas Teknik Universitas Islam Riau dengan ini menerangkan dengan sebenarnya bahwa:
        </Text>

        {/* Biodata Mahasiswa */}
        <View style={styles.biodataBox}>
          <View style={styles.biodataRow}>
            <Text style={styles.bioLabel}>Nama Lengkap</Text>
            <Text style={styles.bioValue}>: {surat.namaMahasiswa}</Text>
          </View>
          <View style={styles.biodataRow}>
            <Text style={styles.bioLabel}>Nomor Induk Mahasiswa (NIM)</Text>
            <Text style={styles.bioValue}>: {surat.nim}</Text>
          </View>
          <View style={styles.biodataRow}>
            <Text style={styles.bioLabel}>Program Studi</Text>
            <Text style={styles.bioValue}>: {surat.prodiNama}</Text>
          </View>
          <View style={styles.biodataRow}>
            <Text style={styles.bioLabel}>Jenjang Pendidikan</Text>
            <Text style={styles.bioValue}>: Strata Satu (S1)</Text>
          </View>
          <View style={styles.biodataRow}>
            <Text style={styles.bioLabel}>Tahun Angkatan</Text>
            <Text style={styles.bioValue}>: {surat.angkatan}</Text>
          </View>
          <View style={styles.biodataRow}>
            <Text style={styles.bioLabel}>Semester / Tahun Akademik</Text>
            <Text style={styles.bioValue}>: Ganjil 2026/2027</Text>
          </View>
        </View>

        {/* Pernyataan Resmi */}
        <Text style={styles.paragraph}>
          {surat.jenis === "AKTIF_KULIAH"
            ? "Adalah benar mahasiswa yang bersangkutan tercatat aktif mengikuti kegiatan perkuliahan pada Semester Ganjil Tahun Akademik 2026/2027 di Fakultas Teknik Universitas Islam Riau, serta berkelakuan baik dan tidak sedang menjalani sanksi akademik."
            : surat.jenis === "CUTI_AKADEMIK"
            ? "Telah disetujui untuk menjalani Cuti Akademik pada Semester Ganjil Tahun Akademik 2026/2027 sesuai dengan prosedur administrasi yang berlaku."
            : "Adalah mahasiswa berprestasi dan berdedikasi tinggi yang direkomendasikan untuk mengikuti program beasiswa / pembinaan akademik."}
        </Text>

        <Text style={styles.paragraph}>
          Surat keterangan ini diberikan atas permohonan yang bersangkutan untuk keperluan:{" "}
          <strong>{surat.keterangan}</strong>.
        </Text>

        <Text style={styles.paragraph}>
          Demikian surat keterangan ini diterbitkan dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
        </Text>

        {/* Pengesahan */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.dateText}>Pekanbaru, {tanggalCetak}</Text>
            <Text style={styles.signTitle}>Dekan Fakultas Teknik,</Text>
            <Text style={styles.signName}>Prof. Dr. Ir. H. Zamzami, M.T.</Text>
            <Text style={styles.signNip}>NIP. 197204121998031001</Text>
          </View>
        </View>

        {/* Stamp Validasi */}
        <View style={styles.stampBox}>
          <Text style={styles.stampText}>
            Dokumen ini sah dan diterbitkan secara digital oleh Sistem Informasi Akademik (SIAKAD) Universitas Islam Riau.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
