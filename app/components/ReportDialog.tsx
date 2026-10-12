"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/shared";

const reportCopy = {
  zh: {
    title: "你要举报什么问题？",
    subtitle: "请选择最符合情况的原因。",
    cancel: "取消",
    submit: "提交举报",
    reasons: [
      "垃圾信息",
      "仇恨、辱骂或骚扰",
      "暴力言论",
      "违法或受监管行为",
      "冒充他人",
      "隐私或未经同意的内容",
      "儿童安全",
      "自杀或自残",
      "恐怖主义或暴力极端主义",
      "公民诚信",
    ],
  },
  en: {
    title: "What are you reporting?",
    subtitle: "Please choose the category that best describes your issue.",
    cancel: "Cancel",
    submit: "Submit report",
    reasons: [
      "Spam",
      "Hate, Abuse, or Harassment",
      "Violent Speech",
      "Illegal and Regulated Behaviors",
      "Impersonation",
      "Private or Non-Consensual Content",
      "Child Safety",
      "Suicide or Self-Harm",
      "Terrorism or Violent Extremism",
      "Civic Integrity",
    ],
  },
  ja: {
    title: "報告する内容を選択",
    subtitle: "問題に最も近いカテゴリを選んでください。",
    cancel: "キャンセル",
    submit: "報告を送信",
    reasons: [
      "スパム",
      "ヘイト、虐待、嫌がらせ",
      "暴力的な発言",
      "違法または規制対象の行為",
      "なりすまし",
      "私的または同意のないコンテンツ",
      "児童の安全",
      "自殺または自傷",
      "テロまたは暴力的過激主義",
      "市民の健全性",
    ],
  },
};

export function ReportDialog({
  locale,
  open,
  onClose,
  onSubmit,
}: {
  locale: Locale;
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const text = reportCopy[locale];
  const [selectedReason, setSelectedReason] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedReason("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-backdrop report-backdrop" role="presentation">
      <div className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title">
        <header className="report-dialog-header">
          <button type="button" onClick={onClose} aria-label={text.cancel}>
            <X size={21} />
          </button>
          <h2 id="report-dialog-title">{text.title}</h2>
        </header>
        <p>{text.subtitle}</p>
        <div className="report-reason-list" role="list">
          {text.reasons.map((reason) => (
            <button
              className={selectedReason === reason ? "selected" : undefined}
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
            >
              <span>{reason}</span>
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
        <footer className="report-dialog-footer">
          <button
            type="button"
            disabled={!selectedReason}
            onClick={() => {
              if (selectedReason) {
                onSubmit(selectedReason);
              }
            }}
          >
            {text.submit}
          </button>
        </footer>
      </div>
    </div>
  );
}
