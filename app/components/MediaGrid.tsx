"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { AppMedia } from "@/lib/shared";

export function MediaGrid({ media, compact = false }: { media?: AppMedia[]; compact?: boolean }) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const imageMedia = useMemo(() => media?.filter((item) => item.type === "image") ?? [], [media]);

  useEffect(() => {
    if (activeImageIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveImageIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveImageIndex((index) => (index === null ? index : (index - 1 + imageMedia.length) % imageMedia.length));
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((index) => (index === null ? index : (index + 1) % imageMedia.length));
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImageIndex, imageMedia.length]);

  if (!media || media.length === 0) {
    return null;
  }

  const activeImage = activeImageIndex === null ? null : imageMedia[activeImageIndex];

  function openImage(url: string) {
    const nextIndex = imageMedia.findIndex((item) => item.url === url);
    if (nextIndex >= 0) {
      setActiveImageIndex(nextIndex);
    }
  }

  function showPreviousImage() {
    setActiveImageIndex((index) => (index === null ? index : (index - 1 + imageMedia.length) % imageMedia.length));
  }

  function showNextImage() {
    setActiveImageIndex((index) => (index === null ? index : (index + 1) % imageMedia.length));
  }

  return (
    <>
      <div className={`media-grid media-count-${Math.min(media.length, 3)}`} onClick={(event) => event.stopPropagation()}>
        {media.map((item, index) =>
          item.type === "video" ? (
            <video className={compact ? "media-video compact" : "media-video"} key={item.url} src={item.url} controls playsInline />
          ) : (
            <button
              className="media-image-button"
              key={item.url}
              type="button"
              aria-label={`Open image ${index + 1}`}
              onClick={() => openImage(item.url)}
            >
              <Image src={item.url} alt="" width={720} height={420} unoptimized />
            </button>
          ),
        )}
      </div>

      {activeImage ? (
        <div className="media-lightbox" role="dialog" aria-modal="true" aria-label="Image preview" onClick={() => setActiveImageIndex(null)}>
          <button className="media-lightbox-close" type="button" aria-label="Close image preview" onClick={() => setActiveImageIndex(null)}>
            <X size={24} />
          </button>

          {imageMedia.length > 1 ? (
            <button
              className="media-lightbox-nav media-lightbox-prev"
              type="button"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                showPreviousImage();
              }}
            >
              <ChevronLeft size={32} />
            </button>
          ) : null}

          <div className="media-lightbox-stage" onClick={(event) => event.stopPropagation()}>
            <Image src={activeImage.url} alt="" width={1600} height={1200} unoptimized priority />
          </div>

          {imageMedia.length > 1 ? (
            <button
              className="media-lightbox-nav media-lightbox-next"
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                showNextImage();
              }}
            >
              <ChevronRight size={32} />
            </button>
          ) : null}

          {imageMedia.length > 1 && activeImageIndex !== null ? (
            <div className="media-lightbox-count">
              {activeImageIndex + 1} / {imageMedia.length}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function ComposerMediaPreview({
  media,
  onRemove,
}: {
  media: AppMedia[];
  onRemove: (url: string) => void;
}) {
  if (media.length === 0) {
    return null;
  }

  return (
    <div className={`composer-media-grid media-count-${Math.min(media.length, 3)}`}>
      {media.map((item) => (
        <div className="composer-media-item" key={item.url}>
          {item.type === "video" ? (
            <video className="composer-video-preview" src={item.url} controls playsInline />
          ) : (
            <Image src={item.url} alt="" width={360} height={240} unoptimized />
          )}
          <button type="button" aria-label="Remove media" onClick={() => onRemove(item.url)}>
            <span aria-hidden="true">x</span>
          </button>
        </div>
      ))}
    </div>
  );
}
