'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase-client';
import { gameAudio } from '../../lib/audio';
import { MessageCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';

// ── 타입 정의 ──────────────────────────────────────────
interface LobbyChatPanelProps {
  sessionCode: string;
  playerName: string;
  playerAvatar: string;
}

interface ChatMessage {
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
}

// ── 한국어 비속어 필터 ─────────────────────────────────
const PROFANITY_LIST: readonly string[] = [
  '시발', '씨발', '개새끼', '병신', '지랄', '바보', '멍청이',
] as const;

function filterProfanity(text: string): string {
  let filtered = text;
  for (const word of PROFANITY_LIST) {
    const replacement = '★'.repeat(word.length);
    // Use a global regex with escaped word for replacement
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filtered = filtered.replace(new RegExp(escaped, 'g'), replacement);
  }
  return filtered;
}

// ── 상수 ───────────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 50;
const MAX_MESSAGES = 30;
const CHANNEL_PREFIX = 'lobby_chat_';

export default function LobbyChatPanel({
  sessionCode,
  playerName,
  playerAvatar,
}: LobbyChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isOpenRef = useRef(isOpen);

  // Keep isOpenRef in sync
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Clear unread count when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Supabase Broadcast subscription
  useEffect(() => {
    const channelName = `${CHANNEL_PREFIX}${sessionCode}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'chat_message' }, (payload: { payload: ChatMessage }) => {
        const msg = payload.payload;
        setMessages((prev) => {
          const updated = [...prev, msg];
          return updated.slice(-MAX_MESSAGES);
        });

        if (!isOpenRef.current) {
          setUnreadCount((prev) => prev + 1);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionCode]);

  // 메시지 전송
  const sendMessage = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || !channelRef.current) return;

    const filtered = filterProfanity(trimmed);

    const message: ChatMessage = {
      sender: playerName,
      avatar: playerAvatar,
      text: filtered,
      timestamp: Date.now(),
    };

    channelRef.current.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: message,
    });

    // Add message locally immediately
    setMessages((prev) => {
      const updated = [...prev, message];
      return updated.slice(-MAX_MESSAGES);
    });

    setInputText('');
    gameAudio.playClick();
  }, [inputText, playerName, playerAvatar]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
    gameAudio.playClick();
  }, []);

  // 시간 포맷 (HH:MM)
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 font-sans">
      {/* ── 채팅 패널 본체 ─────────────────────────── */}
      <div
        className={`
          overflow-hidden rounded-xl border border-cyan-500/20
          bg-gradient-to-b from-[#0d1526]/95 to-[#060a14]/98
          backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]
          transition-all duration-300 ease-in-out
          ${isOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0 border-transparent'}
        `}
      >
        {/* 메시지 리스트 */}
        <div
          ref={scrollContainerRef}
          className="max-h-60 overflow-y-auto p-3 space-y-2 scrollbar-thin"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-600">
              <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">아직 메시지가 없습니다</p>
              <p className="text-[10px] mt-1 text-gray-700">첫 번째 메시지를 보내보세요!</p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isOwn = msg.sender === playerName;
            return (
              <div
                key={`${msg.timestamp}-${idx}`}
                className={`flex items-start gap-2 animate-[fadeSlideIn_0.2s_ease-out] ${
                  isOwn ? 'flex-row-reverse' : ''
                }`}
              >
                {/* 아바타 */}
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0
                    ${isOwn
                      ? 'bg-cyan-950/60 border border-cyan-500/30'
                      : 'bg-gray-900/60 border border-gray-700/30'
                    }
                  `}
                >
                  {msg.avatar}
                </div>

                {/* 메시지 버블 */}
                <div className={`max-w-[200px] ${isOwn ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span
                      className={`text-[10px] font-bold truncate ${
                        isOwn ? 'text-cyan-400' : 'text-gray-400'
                      }`}
                    >
                      {msg.sender}
                    </span>
                    <span className="text-[9px] text-gray-600 font-mono">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`
                      px-2.5 py-1.5 rounded-lg text-xs leading-relaxed break-words
                      ${isOwn
                        ? 'bg-cyan-950/40 border border-cyan-500/15 text-cyan-100'
                        : 'bg-gray-900/50 border border-gray-800/30 text-gray-300'
                      }
                    `}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-2.5 border-t border-cyan-500/10 bg-[#060a14]/80">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 px-3 py-2 bg-gray-950/80 border border-gray-800/50 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
              aria-label="메시지 전송"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-right mt-1">
            <span className="text-[9px] font-mono text-gray-700">
              {inputText.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>
      </div>

      {/* ── 토글 헤더 버튼 ──────────────────────────── */}
      <button
        onClick={togglePanel}
        className={`
          w-full mt-1 px-4 py-2.5 rounded-xl flex items-center justify-between
          border transition-all duration-200
          ${isOpen
            ? 'bg-[#0d1526]/95 border-cyan-500/30 shadow-neonBlue'
            : 'bg-[#0d1526]/80 border-gray-800/50 hover:border-cyan-500/20 hover:shadow-neonBlue'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            {/* 읽지 않은 메시지 배지 */}
            {!isOpen && unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-gray-300 tracking-wide">
            💬 로비 채팅
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-gray-600">
            {messages.length}건
          </span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
          )}
        </div>
      </button>

      {/* ── CSS 애니메이션 ──────────────────────────── */}
      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.15);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.3);
        }
      `}</style>
    </div>
  );
}
