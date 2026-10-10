import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { JadwalUjianItem } from "@/features/ujian/ujian-store";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#101828",
    backgroundColor: "#FFFFFF",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#2A4DB7",
    paddingBottom: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: "#2A4DB7",
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
    color: "#2A4DB7",
    letterSpacing: 0.5,
  },
  instansiSub: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#101828",
    marginTop: 2,
  },
  instansiAddress: {
    fontSize: 8,
    color: "#667085",
    marginTop: 2,
  },
  documentTitleContainer: {
    textAlign: "center",
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#101828",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  documentNo: {
    fontSize: 8,
    color: "#667085",
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  metaGrid: {
    flex: 1,
    padding: 8,
    backgroundColor: "#F6F7F9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    width: 85,
    fontSize: 8,
    color: "#667085",
  },
  metaValue: {
    flex: 1,
    fontSize: 8,
    fontWeight: "bold",
    color: "#101828",
  },
  photoBox: {
    width: 75,
    height: 95,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 4,
    backgroundColor: "#F6F7F9",
    justifyContent: "center",
    alignItems: "center",
  },
  photoText: {
    fontSize: 8,
    color: "#667085",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 4,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#EEF2FC",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E7EC",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E7EC",
    paddingVertical: 4.5,
    paddingHorizontal: 6,
  },
  tableRowEven: {
    backgroundColor: "#FAFAFA",
  },
  colNo: { width: "6%", textAlign: "center" },
  colKode: { width: "16%" },
  colNama: { width: "36%" },
  colSks: { width: "8%", textAlign: "center" },
  colTanggal: { width: "14%", textAlign: "center" },
  colWaktu: { width: "10%", textAlign: "center" },
  colRuang: { width: "10%", textAlign: "center" },
  rulesBox: {
    padding: 8,
    backgroundColor: "#F6F7F9",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    marginBottom: 14,
  },
  rulesTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#101828",
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 7.5,
    color: "#667085",
    marginBottom: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  signatureBox: {
    width: 180,
    textAlign: "center",
  },
  dateText: {
    fontSize: 8,
    color: "#667085",
    marginBottom: 3,
  },
  signTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#101828",
    marginBottom: 40,
  },
  signName: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#101828",
    textDecoration: "underline",
  },
  signNip: {
    fontSize: 7,
    color: "#667085",
    marginTop: 2,
  },
});

export interface KartuUjianDocProps {
  nomorDokumen: string;
  tanggalCetak: string;
  jenisUjian: "UTS" | "UAS";
  tahunAjaranKode: string;
  mahasiswa: {
    nim: string;
    nama: string;
    prodi: string;
    angkatan: number;
    dosenWali?: string;
  };
  jadwalList: JadwalUjianItem[];
}

export function DokumenKartuUjianPdf({
  nomorDokumen,
  tanggalCetak,
  jenisUjian,
  tahunAjaranKode,
  mahasiswa,
  jadwalList,
}: KartuUjianDocProps) {
  return (
    <Document title={`Kartu_${jenisUjian}_${mahasiswa.nim}`}>
      <Page size="A4" style={styles.page}>
        {/* Kop Surat */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>UIR</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.instansiTitle}>UNIVERSITAS ISLAM RIAU</Text>
            <Text style={styles.instansiSub}>FAKULTAS TEKNIK - PANITIA UJIAN SEMESTER</Text>
            <Text style={styles.instansiAddress}>
              Jl. Kaharuddin Nasution No. 113, Pekanbaru, Riau | Telp: (0761) 674674 | Web: www.uir.ac.id
            </Text>
          </View>
        </View>

        {/* Judul & Nomor Dokumen */}
        <View style={styles.documentTitleContainer}>
          <Text style={styles.documentTitle}>
            KARTU PESERTA {jenisUjian === "UTS" ? "UJIAN TENGAH SEMESTER (UTS)" : "UJIAN AKHIR SEMESTER (UAS)"}
          </Text>
          <Text style={styles.documentNo}>
            Nomor Dokumen: {nomorDokumen} | Tahun Akademik: {tahunAjaranKode}
          </Text>
        </View>

        {/* Metadata Mahasiswa & Box Foto */}
        <View style={styles.metaContainer}>
          <View style={styles.metaGrid}>
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
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Dosen Wali</Text>
              <Text style={styles.metaValue}>: {mahasiswa.dosenWali || "Dr. Ardiansyah, S.T., M.Kom."}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status Syarat</Text>
              <Text style={styles.metaValue}>: LENGKAP (KRS, UKT & Presensi Terpenuhi)</Text>
            </View>
          </View>

          <View style={styles.photoBox}>
            <Text style={styles.photoText}>Pas Foto</Text>
            <Text style={styles.photoText}>3 x 4 cm</Text>
          </View>
        </View>

        {/* Tabel Jadwal Ujian */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>No</Text>
            <Text style={styles.colKode}>Kode MK</Text>
            <Text style={styles.colNama}>Mata Kuliah</Text>
            <Text style={styles.colSks}>SKS</Text>
            <Text style={styles.colTanggal}>Tanggal</Text>
            <Text style={styles.colWaktu}>Waktu</Text>
            <Text style={styles.colRuang}>Ruangan</Text>
          </View>

          {jadwalList.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
            >
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colKode}>{item.kodeMataKuliah}</Text>
              <Text style={styles.colNama}>
                {item.namaMataKuliah} (Kelas {item.kodeKelas})
              </Text>
              <Text style={styles.colSks}>{item.sks}</Text>
              <Text style={styles.colTanggal}>{item.tanggal}</Text>
              <Text style={styles.colWaktu}>
                {item.jamMulai} - {item.jamSelesai}
              </Text>
              <Text style={styles.colRuang}>{item.namaRuang}</Text>
            </View>
          ))}
        </View>

        {/* Tata Tertib Ujian */}
        <View style={styles.rulesBox}>
          <Text style={styles.rulesTitle}>TATA TERTIB PESERTA UJIAN:</Text>
          <Text style={styles.ruleText}>
            1. Peserta wajib membawa Kartu Ujian fisik dan Kartu Tanda Mahasiswa (KTM) yang masih berlaku.
          </Text>
          <Text style={styles.ruleText}>
            2. Peserta harus hadir di ruang ujian paling lambat 15 menit sebelum waktu ujian dimulai.
          </Text>
          <Text style={styles.ruleText}>
            3. Berpakaian rapi, sopan, bersepatu, dan mengenakan pakaian kemeja berkerah.
          </Text>
          <Text style={styles.ruleText}>
            4. Dilarang membawa handphone/gadget ke atas meja ujian atau melakukan tindakan kecurangan dalam bentuk apa pun.
          </Text>
        </View>

        {/* Tanda Tangan */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.dateText}>Peserta Ujian,</Text>
            <Text style={styles.signTitle}>Mahasiswa Bersangkutan</Text>
            <Text style={styles.signName}>{mahasiswa.nama}</Text>
            <Text style={styles.signNip}>NIM. {mahasiswa.nim}</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.dateText}>Pekanbaru, {tanggalCetak}</Text>
            <Text style={styles.signTitle}>Ketua Panitia Ujian</Text>
            <Text style={styles.signName}>Dr. Ardiansyah, S.T., M.Kom.</Text>
            <Text style={styles.signNip}>NIP. 198008242005011002</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
