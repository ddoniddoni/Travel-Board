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
  const [draft, setDraft] = useState("2일차를 더 여유롭게 바꿔줘");

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

          <textarea
            className="field mt-4 min-h-24 resize-none"
            maxLength={800}
            onChange={(event) => setDraft(event.target.value)}
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
