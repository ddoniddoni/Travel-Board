"use client";

import { useState } from "react";
import type { ChatMessage } from "../types";

type ChatModificationPanelProps = {
  disabled: boolean;
  hasTrip: boolean;
  isEditing: boolean;
  messages: ChatMessage[];
  onSubmit: (message: string) => void;
};

const quickRequests = [
  "2일차를 더 여유롭게 바꿔줘",
  "맛집을 한 곳 더 넣어줘",
  "비 오는 날에도 괜찮게 바꿔줘",
];

function formatMessageTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "방금"
    : new Intl.DateTimeFormat("ko-KR", {
        hour: "numeric",
        minute: "2-digit",
      }).format(date);
}

export function ChatModificationPanel({
  disabled,
  hasTrip,
  isEditing,
  messages,
  onSubmit,
}: ChatModificationPanelProps) {
  const [draft, setDraft] = useState("");

  function submit() {
    const message = draft.trim();
    if (!message) return;

    onSubmit(message);
    setDraft("");
  }

  return (
    <section className="panel p-5">
      <p className="text-sm font-bold text-[var(--accent)]">채팅 수정</p>
      <h2 className="mt-1 text-2xl font-bold">일정 바꾸기</h2>

      {!hasTrip ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          먼저 여행 일정을 만들면, 이곳에서 “맛집을 더 넣어줘”처럼 자연스럽게 변경을 요청할 수 있어요.
        </p>
      ) : (
        <>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm leading-6 text-slate-600">
            원하는 변경을 요청하면 대화와 일정 변경 결과가 여기에 남습니다.
          </p>
        ) : (
          messages.map((chatMessage) => (
            <article
              className={
                chatMessage.role === "user"
                  ? "chat-message user"
                  : "chat-message assistant"
              }
              key={chatMessage.id}
            >
              <div className="flex items-center justify-between gap-3 text-xs font-bold">
                <span>{chatMessage.role === "user" ? "나" : "AI 플래너"}</span>
                <time>{formatMessageTime(chatMessage.createdAt)}</time>
              </div>
              <p className="mt-1 text-sm leading-6">{chatMessage.content}</p>
            </article>
          ))
        )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="빠른 수정 요청">
            {quickRequests.map((request) => (
              <button
                className="quick-request"
                key={request}
                onClick={() => setDraft(request)}
                type="button"
              >
                {request}
              </button>
            ))}
          </div>

          <textarea
            aria-label="일정 변경 요청"
            className="field mt-4 min-h-24 resize-none"
            maxLength={800}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="예: 첫날은 카페를 줄이고, 실내 전시를 넣어줘"
            value={draft}
          />
          <button
            className="primary-button mt-3"
            disabled={disabled || !draft.trim()}
            onClick={submit}
            type="button"
          >
            {isEditing ? "수정 중..." : "요청 반영"}
          </button>
        </>
      )}
    </section>
  );
}
