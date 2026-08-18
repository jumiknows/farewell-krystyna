/* eslint-disable @next/next/no-img-element -- Keepsake photos and animated GIFs retain their original formats. */
import type { PostcardAttachment } from "./postcard-media";

type PostcardMediaGalleryProps = {
  items: PostcardAttachment[];
  variant: "preview" | "recipient" | "focused" | "wall";
  label: string;
  lazy?: boolean;
};

export function PostcardMediaGallery({ items, variant, label, lazy = false }: PostcardMediaGalleryProps) {
  if (!items.length) return null;

  return (
    <div className={`postcard-media-grid ${variant}-media ${items.length === 1 ? "is-single" : "is-pair"}`} aria-label={label}>
      {items.map(item => (
        <figure className={item.kind === "gif" ? "postcard-photo is-animated" : "postcard-photo"} key={item.src}>
          <img src={item.src} alt={item.label} loading={lazy ? "lazy" : "eager"} decoding="async"/>
          {item.kind === "gif" && <span className="postcard-photo-badge" aria-hidden="true">GIF</span>}
        </figure>
      ))}
    </div>
  );
}
