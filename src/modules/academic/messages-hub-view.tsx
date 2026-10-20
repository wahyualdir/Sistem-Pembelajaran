'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Calendar,
  Send,
  Paperclip,
  Trash2,
  AlertTriangle,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  User,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  ConversationItem,
  MessageItem,
  listConversationsAction,
  getConversationMessagesAction,
  sendMessageAction,
  deleteMessageAction,
  reportMessageAction,
  createConsultationSlotAction,
  listConsultationSlotsAction,
  bookConsultationSlotAction,
  cancelConsultationBookingAction,
  markConsultationFinishedAction,
} from './message-actions';
import { isLecturerQuietHours } from '@/lib/akademik/message-utils';

interface MessagesHubViewProps {
  currentUserRole: string;
  currentUserId: string;
}

export function MessagesHubView({ currentUserRole, currentUserId }: MessagesHubViewProps) {
  const [activeTab, setActiveTab] = useState<'percakapan' | 'konsultasi'>('percakapan');

  // State Percakapan
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [quietHoursNotice, setQuietHoursNotice] = useState<string | null>(null);

  // State Pelaporan
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // State Konsultasi
  const [slots, setSlots] = useState<any[]>([]);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);
  const [newSlotStarts, setNewSlotStarts] = useState('');
  const [newSlotEnds, setNewSlotEnds] = useState('');
  const [newSlotPlace, setNewSlotPlace] = useState('');
  const [newSlotCapacity, setNewSlotCapacity] = useState(1);
  const [bookingTopic, setBookingTopic] = useState('');
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState<string | null>(null);
  const [lecturerNote, setLecturerNote] = useState('');
  const [finishingBookingId, setFinishingBookingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    listConversationsAction().then((res) => {
      if (res.ok && res.conversations) {
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !selectedConvId) {
          setSelectedConvId(res.conversations[0].id);
        }
      }
    });

    listConsultationSlotsAction().then((res) => {
      if (res.ok && res.slots) {
        setSlots(res.slots);
      }
    });
  }, [selectedConvId]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConvId) return;
    setIsLoadingMessages(true);
    getConversationMessagesAction(selectedConvId).then((res) => {
      setIsLoadingMessages(false);
      if (res.ok) {
        setMessages(res.messages);
      }
    });
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !inputText.trim() || isSending) return;

    setIsSending(true);
    const res = await sendMessageAction({
      conversationId: selectedConvId,
      body: inputText.trim(),
    });
    setIsSending(false);

    if (res.ok) {
      setInputText('');
      if (res.quietHoursNotice) {
        setQuietHoursNotice(res.quietHoursNotice);
      }
      // Refresh messages
      const msgsRes = await getConversationMessagesAction(selectedConvId);
      if (msgsRes.ok) setMessages(msgsRes.messages);
    } else {
      alert(res.error || 'Gagal mengirim pesan.');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Hapus pesan ini?')) return;
    const res = await deleteMessageAction(msgId);
    if (res.ok && selectedConvId) {
      const msgsRes = await getConversationMessagesAction(selectedConvId);
      if (msgsRes.ok) setMessages(msgsRes.messages);
    }
  };

  const handleReportMessage = async () => {
    if (!reportingMsgId || !reportReason.trim()) return;
    const res = await reportMessageAction(reportingMsgId, reportReason.trim());
    if (res.ok) {
      setReportSuccess(true);
      setTimeout(() => {
        setReportingMsgId(null);
        setReportReason('');
        setReportSuccess(false);
      }, 1500);
    } else {
      alert(res.error || 'Gagal mengirim laporan.');
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createConsultationSlotAction({
      startsAt: newSlotStarts,
      endsAt: newSlotEnds,
      placeOrLink: newSlotPlace,
      capacity: newSlotCapacity,
    });
    if (res.ok) {
      setIsCreatingSlot(false);
      setNewSlotStarts('');
      setNewSlotEnds('');
      setNewSlotPlace('');
      const slotsRes = await listConsultationSlotsAction();
      if (slotsRes.ok && slotsRes.slots) setSlots(slotsRes.slots);
    } else {
      alert(res.error || 'Gagal membuat slot.');
    }
  };

  const handleBookSlot = async (slotId: string) => {
    if (!bookingTopic.trim() || bookingTopic.trim().length < 5) {
      alert('Topik konsultasi minimal 5 karakter.');
      return;
    }
    const res = await bookConsultationSlotAction(slotId, bookingTopic.trim());
    if (res.ok) {
      setSelectedSlotForBooking(null);
      setBookingTopic('');
      const slotsRes = await listConsultationSlotsAction();
      if (slotsRes.ok && slotsRes.slots) setSlots(slotsRes.slots);
    } else {
      alert(res.error || 'Gagal memesan slot.');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Batalkan pemesanan jadwal konsultasi ini?')) return;
    const res = await cancelConsultationBookingAction(bookingId);
    if (res.ok) {
      const slotsRes = await listConsultationSlotsAction();
      if (slotsRes.ok && slotsRes.slots) setSlots(slotsRes.slots);
    } else {
      alert(res.error || 'Gagal membatalkan konsultasi.');
    }
  };

  const handleFinishBooking = async (bookingId: string) => {
    const res = await markConsultationFinishedAction(bookingId, lecturerNote);
    if (res.ok) {
      setFinishingBookingId(null);
      setLecturerNote('');
      const slotsRes = await listConsultationSlotsAction();
      if (slotsRes.ok && slotsRes.slots) setSlots(slotsRes.slots);
    } else {
      alert(res.error || 'Gagal menandai selesai.');
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  return (
    <div className="space-y-6">
      {/* Navigasi Tab */}
      <div className="flex items-center gap-2 border-b-2 border-ink pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('percakapan')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-ink text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'percakapan'
              ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
              : 'bg-surface text-ink hover:bg-gray-soft shadow-xs'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Percakapan</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('konsultasi')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-ink text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'konsultasi'
              ? 'bg-ink text-white border-b-4 border-b-primary shadow-retro'
              : 'bg-surface text-ink hover:bg-gray-soft shadow-xs'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Jadwal Konsultasi</span>
        </button>
      </div>

      {activeTab === 'percakapan' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 rounded-xl border-2 border-ink bg-surface shadow-retro overflow-hidden min-h-[550px]">
          {/* Kolom Kiri: Daftar Percakapan */}
          <div className="border-r-2 border-ink flex flex-col h-full bg-gray-soft/30">
            <div className="p-3.5 border-b-2 border-ink bg-gray-soft">
              <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-gray-dark">Kotak Masuk</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y-2 divide-ink/10">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-gray-dark">
                  Belum ada percakapan aktif.
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left p-4 hover:bg-surface-subtle transition-colors flex items-start gap-3 ${
                      selectedConvId === c.id ? 'bg-surface-subtle border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                      {c.partnerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground truncate">{c.partnerName}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString('id-ID') : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {c.lastMessage || 'Belum ada pesan'}
                      </p>
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {c.classTitle}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Kolom Kanan: Isi Percakapan */}
          <div className="md:col-span-2 flex flex-col h-full">
            {selectedConv ? (
              <>
                <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{selectedConv.partnerName}</h3>
                    <p className="text-xs text-muted-foreground">{selectedConv.classTitle}</p>
                  </div>
                  {isLecturerQuietHours() && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Jam tenang dosen</span>
                    </span>
                  )}
                </div>

                {quietHoursNotice && (
                  <div className="m-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>{quietHoursNotice}</span>
                  </div>
                )}

                {/* Daftar Balon Pesan */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[420px]">
                  {isLoadingMessages ? (
                    <p className="text-center text-xs text-muted-foreground py-8">Memuat pesan...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">
                      Mulai percakapan dengan mengirim pesan pertama.
                    </p>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-[12px] p-3 text-xs leading-relaxed relative group ${
                            m.isDeleted
                              ? 'bg-muted/50 text-muted-foreground italic'
                              : m.isMine
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p>{m.body}</p>
                          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75">
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {!m.isDeleted && m.isMine && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:opacity-75"
                                title="Hapus pesan"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                            {!m.isDeleted && !m.isMine && (
                              <button
                                type="button"
                                onClick={() => setReportingMsgId(m.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-amber-500"
                                title="Laporkan pesan"
                              >
                                <AlertTriangle className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Pesan */}
                <form onSubmit={handleSendMessage} className="p-3 border-t-2 border-ink flex items-center gap-2 bg-surface">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Tulis pesan..."
                    maxLength={2000}
                    className="flex-1 rounded-xl border-2 border-ink px-3.5 py-2 text-xs font-bold bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-ink bg-ink text-white text-xs font-bold hover:bg-ink/90 disabled:opacity-50 shadow-retro cursor-pointer min-h-[40px]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Kirim</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-6">
                Pilih percakapan dari daftar di sebelah kiri.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'konsultasi' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Jadwal Konsultasi Akademik</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pemesanan slot bimbingan dan asistensi akademik bersama dosen pengampu.
              </p>
            </div>
            {currentUserRole === 'LECTURER' && (
              <button
                type="button"
                onClick={() => setIsCreatingSlot(!isCreatingSlot)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Buat Slot Baru</span>
              </button>
            )}
          </div>

          {/* Modal / Form Buat Slot Dosen */}
          {isCreatingSlot && (
            <form onSubmit={handleCreateSlot} className="p-5 rounded-[12px] border border-border bg-surface space-y-4">
              <h3 className="text-sm font-bold text-foreground">Tambah Slot Konsultasi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Waktu Mulai</label>
                  <input
                    type="datetime-local"
                    value={newSlotStarts}
                    onChange={(e) => setNewSlotStarts(e.target.value)}
                    required
                    className="w-full rounded-[8px] border border-border p-2 text-xs bg-surface text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Waktu Selesai</label>
                  <input
                    type="datetime-local"
                    value={newSlotEnds}
                    onChange={(e) => setNewSlotEnds(e.target.value)}
                    required
                    className="w-full rounded-[8px] border border-border p-2 text-xs bg-surface text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tempat / Tautan</label>
                  <input
                    type="text"
                    value={newSlotPlace}
                    onChange={(e) => setNewSlotPlace(e.target.value)}
                    placeholder="Ruang Dosen 302 / Google Meet"
                    className="w-full rounded-[8px] border border-border p-2 text-xs bg-surface text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Kapasitas Mahasiswa (1-20)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newSlotCapacity}
                    onChange={(e) => setNewSlotCapacity(Number(e.target.value))}
                    className="w-full rounded-[8px] border border-border p-2 text-xs bg-surface text-foreground"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingSlot(false)}
                  className="px-3 py-1.5 rounded-[8px] border border-border text-xs text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  Simpan Slot
                </button>
              </div>
            </form>
          )}

          {/* Daftar Slot Tersedia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slots.length === 0 ? (
              <div className="col-span-full p-8 text-center rounded-[12px] border border-border bg-surface text-xs text-muted-foreground">
                Belum ada slot konsultasi terbuka saat ini.
              </div>
            ) : (
              slots.map((s) => (
                <div key={s.id} className="p-4 rounded-[12px] border border-border bg-surface space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{s.profiles?.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.place_or_link || 'Ruang Dosen'}</p>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        s.status === 'terbuka'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {s.status === 'terbuka' ? 'Terbuka' : 'Ditutup'}
                    </span>
                  </div>

                  <div className="text-xs text-foreground/80 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {new Date(s.starts_at).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        pukul{' '}
                        {new Date(s.starts_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(s.ends_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Kapasitas: {s.consultation_bookings?.length || 0} / {s.capacity} mahasiswa
                    </p>
                  </div>

                  {currentUserRole === 'STUDENT' && s.status === 'terbuka' && (
                    <button
                      type="button"
                      onClick={() => setSelectedSlotForBooking(s.id)}
                      className="w-full py-1.5 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                    >
                      Pesan Slot
                    </button>
                  )}

                  {/* Daftar Booking untuk Dosen */}
                  {currentUserRole === 'LECTURER' && s.consultation_bookings?.length > 0 && (
                    <div className="pt-2 border-t border-border space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground">Daftar Pemesan:</p>
                      {s.consultation_bookings.map((b: any) => (
                        <div key={b.id} className="text-xs p-2 rounded bg-muted/40 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{b.profiles?.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">{b.status}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground italic">&ldquo;{b.topic}&rdquo;</p>
                          {b.status === 'dipesan' && (
                            <button
                              type="button"
                              onClick={() => setFinishingBookingId(b.id)}
                              className="text-[10px] font-semibold text-primary hover:underline"
                            >
                              Tandai Selesai
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Pesan Slot Konsultasi */}
      {selectedSlotForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[12px] border border-border bg-surface p-5 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-foreground">Pesan Slot Konsultasi</h3>
            <p className="text-xs text-muted-foreground">
              Tuliskan topik atau kendala akademik yang ingin kamu diskusikan secara singkat.
            </p>
            <textarea
              rows={3}
              value={bookingTopic}
              onChange={(e) => setBookingTopic(e.target.value)}
              placeholder="Contoh: Konsultasi perbaikan tugas bab 3 atau kendala algoritma..."
              className="w-full rounded-[8px] border border-border p-2.5 text-xs bg-surface text-foreground"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSlotForBooking(null)}
                className="px-3 py-1.5 rounded-[8px] border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleBookSlot(selectedSlotForBooking)}
                className="px-4 py-1.5 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Konfirmasi Pemesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Laporkan Pesan */}
      {reportingMsgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[12px] border border-border bg-surface p-5 space-y-4 shadow-lg">
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-sm font-bold text-foreground">Laporkan Pesan ke Moderasi Staf</h3>
            </div>
            {reportSuccess ? (
              <p className="text-xs text-emerald-600 font-medium">Laporan berhasil dikirim.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Salinan pesan beserta 5 pesan sebelumnya akan dikirimkan secara aman ke bagian moderasi staf.
                </p>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Jelaskan pelanggaran atau alasan pelaporan..."
                  className="w-full rounded-[8px] border border-border p-2.5 text-xs bg-surface text-foreground"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportingMsgId(null)}
                    className="px-3 py-1.5 rounded-[8px] border border-border text-xs text-muted-foreground hover:bg-muted"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleReportMessage}
                    className="px-4 py-1.5 rounded-[8px] bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Catatan Selesai Konsultasi Dosen */}
      {finishingBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[12px] border border-border bg-surface p-5 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-foreground">Tandai Konsultasi Selesai</h3>
            <textarea
              rows={3}
              value={lecturerNote}
              onChange={(e) => setLecturerNote(e.target.value)}
              placeholder="Catatan hasil konsultasi atau rekomendasi untuk mahasiswa..."
              className="w-full rounded-[8px] border border-border p-2.5 text-xs bg-surface text-foreground"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFinishingBookingId(null)}
                className="px-3 py-1.5 rounded-[8px] border border-border text-xs text-muted-foreground hover:bg-muted"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleFinishBooking(finishingBookingId)}
                className="px-4 py-1.5 rounded-[8px] bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
