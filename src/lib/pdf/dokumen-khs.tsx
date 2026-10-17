import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Gaya dokumen PDF sesuai Palet Bab VII
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#ED1C24",
    paddingBottom: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: "#ED1C24",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTextContainer: {
    flex: 1,
  },
  instansiTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ED1C24",
    letterSpacing: 0.5,
  },
  instansiSub: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111111",
    marginTop: 2,
  },
  instansiAddress: {
    fontSize: 8,
    color: "#58595B",
    marginTop: 2,
  },
  documentTitleContainer: {
    textAlign: "center",
    marginBottom: 14,
  },
  documentTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111111",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  documentNo: {
    fontSize: 8,
    color: "#58595B",
    marginTop: 3,
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 10,
    backgroundColor: "#F3F3F4",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E3E4",
  },
  metaCol: {
    width: "48%",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  metaLabel: {
    width: 80,
    fontSize: 8,
    color: "#58595B",
  },
  metaValue: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    color: "#111111",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E3E4",
    borderRadius: 4,
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E2E3E4",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E3E4",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E3E4",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRowEven: {
    backgroundColor: "#FFFFFF",
  },
  colNo: { width: "6%", textAlign: "center" },
  colKode: { width: "16%" },
  colNama: { width: "42%" },
  colSks: { width: "10%", textAlign: "center" },
  colHuruf: { width: "12%", textAlign: "center" },
  colBobot: { width: "14%", textAlign: "right" },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  summaryContent: {
    width: 200,
    padding: 8,
    backgroundColor: "#E2E3E4",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ED1C24",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#111111",
  },
  summaryVal: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#ED1C24",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingTop: 10,
  },
  signatureBox: {
    width: 180,
    textAlign: "center",
  },
  dateText: {
    fontSize: 8,
    color: "#58595B",
    marginBottom: 4,
  },
  signTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 45,
  },
  signName: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111111",
    textDecoration: "underline",
  },
  signNip: {
    fontSize: 7,
    color: "#58595B",
    marginTop: 2,
  },
});

export interface KhsDocProps {
  nomorDokumen: string;
  tanggalCetak: string;
  mahasiswa: {
    nim: string;
    nama: string;
    prodi: string;
    angkatan: number;
    dosenWali?: string;
  };
  tahunAjaranKode: string;
  daftarNilai: {
    kodeMataKuliah: string;
    namaMataKuliah: string;
    sks: number;
    nilaiHuruf: string;
    bobot: number;
    nilaiMutu: number;
  }[];
  totalSks: number;
  ips: number;
}

export function DokumenKhsPdf({
  nomorDokumen,
  tanggalCetak,
  mahasiswa,
  tahunAjaranKode,
  daftarNilai,
  totalSks,
  ips,
}: KhsDocProps) {
  return (
    <Document title={`KHS_${mahasiswa.nim}_${tahunAjaranKode.replace(/\s+/g, "_")}`}>
      <Page size="A4" style={styles.page}>
        {/* Kop Surat */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>UIR</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.instansiTitle}>UNIVERSITAS ISLAM RIAU</Text>
            <Text style={styles.instansiSub}>FAKULTAS TEKNIK - PROGRAM STUDI {mahasiswa.prodi.toUpperCase()}</Text>
            <Text style={styles.instansiAddress}>
              Jl. Kaharuddin Nasution No. 113, Pekanbaru, Riau | Telp: (0761) 674674 | Web: www.uir.ac.id
            </Text>
          </View>
        </View>

        {/* Judul & Nomor Dokumen */}
        <View style={styles.documentTitleContainer}>
          <Text style={styles.documentTitle}>KARTU HASIL STUDI (KHS)</Text>
          <Text style={styles.documentNo}>Nomor Dokumen: {nomorDokumen} | Tanggal Cetak: {tanggalCetak}</Text>
        </View>

        {/* Informasi Mahasiswa */}
        <View style={styles.metaGrid}>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>NIM</Text>
              <Text style={styles.metaValue}>: {mahasiswa.nim}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Nama Lengkap</Text>
              <Text style={styles.metaValue}>: {mahasiswa.nama}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Program Studi</Text>
              <Text style={styles.metaValue}>: {mahasiswa.prodi}</Text>
            </View>
          </View>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Semester / T.A.</Text>
              <Text style={styles.metaValue}>: {tahunAjaranKode}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Angkatan</Text>
              <Text style={styles.metaValue}>: {mahasiswa.angkatan}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Dosen Wali</Text>
              <Text style={styles.metaValue}>: {mahasiswa.dosenWali || "Dr. Ardiansyah, S.T., M.Kom."}</Text>
            </View>
          </View>
        </View>

        {/* Tabel Nilai */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colKode}>Kode MK</Text>
            <Text style={styles.colNama}>Mata Kuliah</Text>
            <Text style={styles.colSks}>SKS</Text>
            <Text style={styles.colHuruf}>Nilai Huruf</Text>
            <Text style={styles.colBobot}>Bobot Mutu</Text>
          </View>

          {daftarNilai.map((item, idx) => (
            <View
              key={item.kodeMataKuliah}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
            >
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colKode}>{item.kodeMataKuliah}</Text>
              <Text style={styles.colNama}>{item.namaMataKuliah}</Text>
              <Text style={styles.colSks}>{item.sks}</Text>
              <Text style={styles.colHuruf}>{item.nilaiHuruf}</Text>
              <Text style={styles.colBobot}>{item.bobot.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Ringkasan SKS dan IPS */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total SKS Diambil:</Text>
              <Text style={styles.summaryVal}>{totalSks} SKS</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Indeks Prestasi Semester (IPS):</Text>
              <Text style={styles.summaryVal}>{ips.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Tanda Tangan */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.dateText}>Mengetahui,</Text>
            <Text style={styles.signTitle}>Dosen Pembimbing Akademik</Text>
            <Text style={styles.signName}>{mahasiswa.dosenWali || "Dr. Ardiansyah, S.T., M.Kom."}</Text>
            <Text style={styles.signNip}>NIDN. 1024088001</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.dateText}>Pekanbaru, {tanggalCetak}</Text>
            <Text style={styles.signTitle}>Ketua Program Studi</Text>
            <Text style={styles.signName}>Dr. Ardiansyah, S.T., M.Kom.</Text>
            <Text style={styles.signNip}>NIP. 198008242005011002</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
