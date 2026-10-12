"use client";

import { ImageIcon, Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ComposerMediaPreview } from "@/app/components/MediaGrid";
import type { AppMedia } from "@/lib/shared";

export type ComposerMedia = AppMedia;

const POST_LIMIT = 5000;
const emojiOptions = ["😀", "😂", "😍", "👍", "🔥", "🎉", "🙏", "💡", "✨", "❤️", "😭", "🤔"];

export function ComposerBox({
  avatar,
  placeholder,
  submitLabel,
  helperText,
  disabled,
  notice,
  onNotice,
  onSubmit,
}: {
  avatar: string;
  placeholder: string;
  submitLabel: string;
  helperText: string;
  disabled?: boolean;
  notice?: string;
  onNotice?: (message: string) => void;
  onSubmit: (payload: { body: string; media: ComposerMedia[] }) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<ComposerMedia[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const remaining = POST_LIMIT - draft.length;

  useEffect(() => {
    resizeComposer(textareaRef.current);
  }, [draft]);

  async function handleMediaSelection(files: FileList | null) {
    if (disabled) {
      return;
    }

    if (!files || files.length === 0) {
      return;
    }

    const incoming = Array.from(files);

    if (selectedMedia.length + incoming.length > 9) {
      onNotice?.("最多只能上传 9 个图片或视频。");
      return;
    }

    const uploaded: ComposerMedia[] = [];

    for (const file of incoming) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        onNotice?.(data?.error ?? "Upload failed.");
        continue;
      }

      const data = (await response.json()) as { media: ComposerMedia };
      uploaded.push(data.media);
    }

    if (uploaded.length > 0) {
      setSelectedMedia((items) => [...items, ...uploaded].slice(0, 9));
      onNotice?.("");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function insertEmoji(emoji: string) {
    setDraft((value) => `${value}${emoji}`.slice(0, POST_LIMIT));
    setEmojiPickerOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function handleSubmit() {
    if (disabled || submitting || (!draft.trim() && selectedMedia.length === 0)) {
      return;
    }

    setSubmitting(true);
    const ok = await onSubmit({ body: draft.trim(), media: selectedMedia });
    setSubmitting(false);

    if (ok) {
      setDraft("");
      setSelectedMedia([]);
      resizeComposer(textareaRef.current);
    }
  }

  return (
    <section className="composer" aria-label={placeholder}>
      <div className={avatar.startsWith("/") ? "avatar image-avatar" : "avatar"}>
        {avatar.startsWith("/") ? <img src={avatar} alt="" /> : avatar}
      </div>
      <div className="composer-main">
        <textarea
          ref={textareaRef}
          maxLength={POST_LIMIT}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            resizeComposer(event.currentTarget);
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        {notice ? <p className="composer-notice">{notice}</p> : null}
        <ComposerMediaPreview
          media={selectedMedia}
          onRemove={(url) => setSelectedMedia((items) => items.filter((item) => item.url !== url))}
        />
        <div className="composer-footer">
          <div className="composer-tools">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif,video/mp4,video/webm,video/quicktime"
              multiple
              hidden
              onChange={(event) => handleMediaSelection(event.target.files)}
            />
            <button type="button" title="Media" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={20} />
            </button>
            <div className="emoji-tool">
              <button
                type="button"
                title="Emoji"
                aria-expanded={emojiPickerOpen}
                onClick={() => setEmojiPickerOpen((open) => !open)}
              >
                <Smile size={20} />
              </button>
              {emojiPickerOpen ? (
                <div className="emoji-picker" role="menu">
                  {emojiOptions.map((emoji) => (
                    <button key={emoji} type="button" role="menuitem" onClick={() => insertEmoji(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <span>{helperText}</span>
          </div>
          <div className="composer-actions">
            <span className={remaining < 120 ? "counter danger" : "counter"}>{remaining}</span>
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={disabled || submitting || (!draft.trim() && selectedMedia.length === 0)}
            >
              <Send size={17} />
              <span>{submitLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function resizeComposer(textarea: HTMLTextAreaElement | null) {
  if (!textarea) {
    return;
  }

  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}
