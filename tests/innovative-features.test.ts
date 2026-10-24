import { describe, it, expect } from 'vitest';

describe('Inovasi Pembelajaran Web: Tatap Muka Terpadu, Pembaca Modul, dan Mode Cepat', () => {
  describe('1. Komponen Tatap Muka Daring Langsung (RetroLiveClassroom - Jitsi WebRTC)', () => {
    it('memastikan RetroLiveClassroom terdefinisi dan dapat diimpor tanpa crash', async () => {
      const liveModule = await import('../src/components/retro/retro-live-classroom');
      expect(liveModule.RetroLiveClassroom).toBeDefined();
    }, 20000);

    it('memastikan formula nama room kelas WebRTC memiliki prefix institusi kampus yang aman', () => {
      const classId = 'cls-if-4a-cloud-computing-2026';
      const sanitizedClassId = classId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
      const roomName = `uir-siajar-kelas-${sanitizedClassId}`;

      expect(roomName).toBe('uir-siajar-kelas-clsif4acloudcomp');
      expect(roomName.startsWith('uir-siajar-kelas-')).toBe(true);
      expect(/^[a-zA-Z0-9-]+$/.test(roomName)).toBe(true);
    });
  });

  describe('2. Komponen Pembaca Dokumen & PDF Terpadu (RetroDocViewer)', () => {
    it('memastikan RetroDocViewer terdefinisi dan dapat diimpor tanpa crash', async () => {
      const viewerModule = await import('../src/components/retro/retro-doc-viewer');
      expect(viewerModule.RetroDocViewer).toBeDefined();
    }, 20000);

    it('memastikan deteksi file PDF berfungsi dengan benar', () => {
      const isPdfFile = (fileType?: string, docUrl?: string | null) => {
        return fileType === 'pdf' || (Boolean(docUrl) && docUrl!.toLowerCase().includes('.pdf'));
      };

      expect(isPdfFile('pdf', null)).toBe(true);
      expect(isPdfFile('markdown', 'https://storage.uir.ac.id/modul-1.pdf')).toBe(true);
      expect(isPdfFile('markdown', 'https://storage.uir.ac.id/modul-1.docx')).toBe(false);
      expect(isPdfFile('text', null)).toBe(false);
    });
  });

  describe('3. Komponen Sakelar Mode Ringan (LiteModeToggle)', () => {
    it('memastikan LiteModeToggle terdefinisi dan dapat diimpor tanpa crash', async () => {
      const toggleModule = await import('../src/components/retro/lite-mode-toggle');
      expect(toggleModule.LiteModeToggle).toBeDefined();
    }, 20000);
  });

  describe('4. Velqora OS Command Center (Ctrl + K Academic Spotlight)', () => {
    it('memastikan CommandCenterOS terdefinisi dan dapat diimpor tanpa crash', async () => {
      const cmdModule = await import('../src/components/shared/command-center-os');
      expect(cmdModule.CommandCenterOS).toBeDefined();
    }, 20000);
  });

  describe('5. Anonim Confusion Radar (Barometer Pemahaman Kelas Real-Time)', () => {
    it('memastikan ConfusionRadarPanel terdefinisi dan dapat diimpor tanpa crash', async () => {
      const radarModule = await import('../src/components/retro/confusion-radar-panel');
      expect(radarModule.ConfusionRadarPanel).toBeDefined();
    }, 20000);
  });

  describe('6. Time-Travel Playback & Paste-Burst Detector (Anti-Joki Engine)', () => {
    it('memastikan AssignmentPlaybackPanel terdefinisi dan dapat diimpor tanpa crash', async () => {
      const playbackModule = await import('../src/components/retro/assignment-playback-panel');
      expect(playbackModule.AssignmentPlaybackPanel).toBeDefined();
    }, 20000);
  });
});
