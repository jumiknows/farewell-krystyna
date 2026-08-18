"use client";

/* eslint-disable @next/next/no-img-element -- Postcard photos and animated GIFs remain unoptimized keepsakes. */
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PostcardMediaGallery } from "../postcard-media-gallery";
import {
  MAX_POSTCARD_MEDIA,
  MAX_POSTCARD_STICKERS,
  normalizeGifUrl,
  normalizePostcardStamp,
  POSTCARD_EMOJIS,
  POSTCARD_STICKERS,
  type PostcardAttachment,
  type PostcardMessage,
  type PostcardSticker,
} from "../postcard-media";
import { useFarewellSound } from "../use-farewell-sound";

type Message = PostcardMessage & { id: number };
type StatusTone = "neutral" | "success" | "error";
type PersonalizationTool = "photo" | "gif" | "emoji" | "sticker" | null;

const DRAFT_KEY = "krystyna-farewell-postcard-draft";
const MAX_ORIGINAL_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 1_750_000;
const MAX_PHOTO_DIMENSION = 1800;
const STAMPS = [
  { label: "BEST WISHES", mark: "✓" },
  { label: "MERCI", mark: "M" },
  { label: "BON VOYAGE", mark: "✈" },
  { label: "À BIENTÔT", mark: "☾" },
  { label: "PARIS AWAITS", mark: "⌁" },
] as const;

async function preparePostcardImage(file: File): Promise<File> {
  if (file.type === "image/gif") {
    if (file.size <= MAX_STORED_IMAGE_BYTES) return file;
    throw new Error("That GIF is a little too large. Add it using a GIPHY or Tenor link instead.");
  }

  if (file.size <= MAX_STORED_IMAGE_BYTES) return file;

  let picture: ImageBitmap;
  try {
    picture = await createImageBitmap(file);
  } catch {
    throw new Error("We couldn’t open that photo. Please choose another image.");
  }

  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(picture.width, picture.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(picture.width * scale));
  canvas.height = Math.max(1, Math.round(picture.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    picture.close();
    throw new Error("We couldn’t prepare that photo. Please try another image.");
  }

  context.fillStyle = "#fffaf1";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(picture, 0, 0, canvas.width, canvas.height);
  picture.close();

  for (const quality of [0.84, 0.72, 0.58, 0.44]) {
    const optimized = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
    if (optimized && optimized.size <= MAX_STORED_IMAGE_BYTES) {
      const name = file.name.replace(/\.[^.]+$/, "") || "postcard-photo";
      return new File([optimized], `${name}.jpg`, { type: "image/jpeg" });
    }
  }

  throw new Error("That photo is too detailed for a postcard. Please choose a smaller image.");
}
const PROMPTS = [
  { label: "A favourite memory", mark: "☕", starter: "I’ll always remember the time " },
  { label: "A little thank-you", mark: "👏", starter: "Thank you for " },
  { label: "A wish for Paris", mark: "→", starter: "In Paris, I hope you " },
] as const;

export default function StudioClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [stamp, setStamp] = useState("BEST WISHES");
  const [media, setMedia] = useState<PostcardAttachment[]>([]);
  const [stickers, setStickers] = useState<PostcardSticker[]>([]);
  const [activeTool, setActiveTool] = useState<PersonalizationTool>(null);
  const [gifUrl, setGifUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [draggingPhoto, setDraggingPhoto] = useState(false);
  const [toolMessage, setToolMessage] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sound = useFarewellSound(0.18);

  const wordCount = message.trim() ? message.trim().split(/\s+/).length : 0;
  const contributorNames = [...new Set(messages.map(item => item.name.trim()).filter(Boolean))];

  const load = useCallback(async () => {
    const response = await fetch("/api/messages", { cache: "no-store" });
    if (!response.ok) throw new Error("We couldn’t load the postcards. Please refresh and try again.");
    const data = await response.json();
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/messages", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(data => { if (!cancelled) setMessages(Array.isArray(data.messages) ? data.messages : []); })
      .catch(() => {
        if (!cancelled) {
          setStatusTone("error");
          setStatus("We couldn’t load the postcards. Please refresh and try again.");
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved) as Partial<{ name: string; role: string; message: string; stamp: string; media: PostcardAttachment[]; stickers: PostcardSticker[] }>;
          if (draft.name || draft.role || draft.message || draft.media?.length || draft.stickers?.length) {
            setName(draft.name || "");
            setRole(draft.role || "");
            setMessage(draft.message || "");
            setStamp(STAMPS.some(option => option.label === draft.stamp) ? draft.stamp! : "BEST WISHES");
            setMedia(Array.isArray(draft.media) ? draft.media.slice(0, MAX_POSTCARD_MEDIA) : []);
            setStickers(Array.isArray(draft.stickers) ? draft.stickers.slice(0, MAX_POSTCARD_STICKERS) : []);
            setDraftRestored(true);
          }
        }
      } catch {
        // A blocked or damaged local draft should never interrupt the farewell.
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    if (!draftReady || editingId !== null) return;
    try {
      if (name || role || message || media.length || stickers.length) {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, role, message, stamp, media, stickers }));
      } else {
        window.localStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // Private browsing may deny local storage; the postcard can still be sent.
    }
  }, [draftReady, editingId, name, role, message, stamp, media, stickers]);

  function resetForm() {
    setName("");
    setRole("");
    setMessage("");
    setStamp("BEST WISHES");
    setMedia([]);
    setStickers([]);
    setActiveTool(null);
    setGifUrl("");
    setToolMessage("");
    setEditingId(null);
    setDraftRestored(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Local draft cleanup is optional.
    }
  }

  function choosePrompt(starter: string) {
    setMessage(current => current.trim() ? current : starter);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function uploadPostcardMedia(file: File) {
    if (media.length >= MAX_POSTCARD_MEDIA) {
      setToolMessage("A postcard can hold two photos or GIFs.");
      return;
    }
    if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
      setToolMessage("Choose a photo smaller than 20 MB, or add an animated GIF by link.");
      return;
    }
    if (!/^image\/(?:jpeg|png|webp|gif|avif)$/.test(file.type)) {
      setToolMessage("Choose a JPG, PNG, WebP, AVIF, or animated GIF.");
      return;
    }

    setUploading(true);
    setToolMessage(file.size > MAX_STORED_IMAGE_BYTES ? "Gently preparing your photo…" : "Placing your photo on the postcard…");
    try {
      const image = await preparePostcardImage(file);
      const formData = new FormData();
      formData.append("file", image);
      const response = await fetch("/api/media", { method: "POST", body: formData });
      const result = await response.json() as { attachment?: PostcardAttachment; error?: string };
      if (!response.ok || !result.attachment) throw new Error(result.error || "That image couldn’t be added.");
      setMedia(current => current.length < MAX_POSTCARD_MEDIA ? [...current, result.attachment!] : current);
      setToolMessage(file.type === "image/gif" ? "Your GIF is ready for her postcard." : "Your photo is ready for her postcard.");
    } catch (error) {
      setToolMessage(error instanceof Error ? error.message : "That image couldn’t be added. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function addPostcardFiles(files: FileList | File[]) {
    const remaining = MAX_POSTCARD_MEDIA - media.length;
    if (remaining < 1) {
      setToolMessage("Your postcard already has its two finishing photographs.");
      return;
    }

    const images = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (!images.length) {
      setToolMessage("Choose a photo or animated GIF to add to your postcard.");
      return;
    }

    for (const file of images.slice(0, remaining)) await uploadPostcardMedia(file);
    if (images.length > remaining) setToolMessage("Two images fit beautifully on a postcard. The others weren’t added.");
  }

  function choosePhoto() {
    if (uploading || media.length >= MAX_POSTCARD_MEDIA) return;
    setToolMessage("");
    fileInputRef.current?.click();
  }

  function removePhoto(item: PostcardAttachment) {
    setMedia(current => current.filter(attachment => attachment.src !== item.src));
    setToolMessage(item.kind === "gif" ? "GIF removed from your postcard." : "Photo removed from your postcard.");
  }

  function addGif() {
    if (media.length >= MAX_POSTCARD_MEDIA) {
      setToolMessage("A postcard can hold two photos or GIFs.");
      return;
    }
    const src = normalizeGifUrl(gifUrl);
    if (!src) {
      setToolMessage("Paste a public GIPHY or Tenor GIF link, then try again.");
      return;
    }
    if (media.some(item => item.src === src)) {
      setToolMessage("That GIF is already on your postcard.");
      return;
    }
    setMedia(current => [...current, { kind: "gif", src, label: "Animated postcard GIF" }]);
    setGifUrl("");
    setActiveTool(null);
    setToolMessage("GIF added. It will play on her postcard.");
  }

  function addEmoji(emoji: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? message.length;
    const end = textarea?.selectionEnd ?? message.length;
    const next = `${message.slice(0, start)}${emoji}${message.slice(end)}`;
    if (next.length > 900) {
      setToolMessage("There isn’t enough room for another emoji.");
      return;
    }
    setMessage(next);
    setToolMessage("");
    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  function toggleSticker(sticker: PostcardSticker) {
    if (stickers.some(item => item.symbol === sticker.symbol)) {
      setStickers(current => current.filter(item => item.symbol !== sticker.symbol));
      setToolMessage("");
      return;
    }
    if (stickers.length >= MAX_POSTCARD_STICKERS) {
      setToolMessage("Choose up to four stickers so the postcard stays beautiful.");
      return;
    }
    setStickers(current => [...current, sticker]);
    setToolMessage("");
  }

  async function copyStudioLink() {
    try {
      const studioUrl = new URL(window.location.href);
      studioUrl.hash = "";
      await navigator.clipboard.writeText(studioUrl.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setStatusTone("error");
      setStatus("Copy this page’s address and send it to someone who should add a postcard.");
    }
  }

  function beginEdit(item: Message) {
    setEditingId(item.id);
    setDeleteCandidate(null);
    setName(item.name);
    setRole(item.role);
    setMessage(item.text);
    setStamp(normalizePostcardStamp(item.stamp));
    setMedia(item.media || []);
    setStickers(item.stickers || []);
    setActiveTool(null);
    setToolMessage("");
    setStatusTone("neutral");
    setStatus(`Editing ${item.name}’s postcard.`);
    document.getElementById("postcard-composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatusTone("neutral");
    setStatus(editingId === null ? "Sending your postcard to the wall…" : "Saving your changes…");
    try {
      const response = await fetch("/api/messages", {
        method: editingId === null ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: editingId ?? undefined, name, role, message, stamp, media, stickers }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      const wasEditing = editingId !== null;
      resetForm();
      setStatusTone("success");
      setStatus(wasEditing ? "Postcard updated." : "Your postcard is now part of Krystyna’s farewell.");
      sound.playConfirm();
      try {
        await load();
      } catch {
        setStatusTone("neutral");
        setStatus("Your postcard was saved, but the wall needs a refresh to show it.");
      }
    } catch (error) {
      setStatusTone("error");
      setStatus(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    setStatusTone("neutral");
    setStatus("Removing postcard…");
    try {
      const response = await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      if (editingId === id) resetForm();
      setDeleteCandidate(null);
      setStatusTone("success");
      setStatus("Postcard removed.");
      try {
        await load();
      } catch {
        setStatusTone("neutral");
        setStatus("The postcard was removed, but the wall needs a refresh.");
      }
    } catch {
      setStatusTone("error");
      setStatus("We couldn’t remove that postcard. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="studio-shell" onPointerOverCapture={event => { if (event.pointerType === "mouse" && (event.target as HTMLElement).closest("button:not(:disabled),a")) sound.playSelect(); }} onClickCapture={event => { if ((event.target as HTMLElement).closest("button:not(:disabled)")) sound.playPress(); }}>
      <div className="paper-grain" aria-hidden="true" />
      <aside className={sound.enabled ? "sound-control studio-sound is-playing" : "sound-control studio-sound"} aria-label="Studio sound controls"><div className="sound-meta"><span>The writing room</span><strong>A little café music</strong></div><button onClick={sound.enabled ? sound.stop : sound.start} aria-pressed={sound.enabled} aria-label={sound.enabled ? "Mute all sounds" : "Turn on music and tactile sounds"}><span className={sound.enabled ? "sound-wave active" : "sound-wave"}>♪</span>{sound.enabled ? "Pause" : "Play"}</button>{sound.enabled && <label><span className="sr-only">Master sound volume</span><input type="range" min="0" max="0.5" step="0.01" value={sound.volume} onChange={event => sound.setVolume(Number(event.target.value))}/></label>}</aside>

      <header className="studio-header atelier-hero">
        <nav className="atelier-masthead" aria-label="Writing room navigation"><Link className="atelier-wordmark" href="/">pour Krystyna</Link><span className="atelier-edition">TEAM CORRESPONDENCE · ÉDITION 01</span><button className="atelier-share-top" type="button" onClick={() => void copyStudioLink()}>{copied ? "Link copied" : "Invite a teammate"} <span aria-hidden="true">↗</span></button></nav>
        <div className="atelier-hero-grid">
          <div className="atelier-hero-copy">
            <p className="eyebrow">CORRESPONDENCE ATELIER · OTTAWA — PARIS</p>
            <h1>Write her<br/><em>something memorable.</em></h1>
            <p className="studio-intro">A good memory, a thoughtful thank-you, or a wish for her next adventure in France.</p>
            <div className="atelier-hero-actions"><button className="atelier-start" type="button" onClick={() => document.getElementById("postcard-composer")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Start your postcard <span aria-hidden="true">→</span></button><Link className="preview-link" href="/" target="_blank" rel="noreferrer">View the farewell <span aria-hidden="true">↗</span></Link></div>
          </div>
          <div className="atelier-desk" aria-label="Ottawa to Paris, 20 August 2026">
            <div className="desk-envelope desk-envelope-back" aria-hidden="true"/><div className="desk-envelope desk-envelope-front" aria-hidden="true"><span>K</span></div>
            <div className="desk-ticket"><span className="desk-ticket-label">PAR AVION · PRIORITY POST</span><div className="desk-flight"><div><span>FROM</span><strong>YOW</strong><small>Ottawa</small></div><i aria-hidden="true">✈</i><div><span>TO</span><strong>CDG</strong><small>Paris</small></div></div><div className="desk-ticket-footer"><span>20 AUG 2026</span><strong>{loading ? "··" : String(messages.length).padStart(2, "0")} NOTE{messages.length === 1 ? "" : "S"}</strong></div></div>
            <span className="desk-caption">assembled quietly by the team</span>
          </div>
        </div>
      </header>

      <section className="studio-grid atelier-workspace" aria-label="Farewell message editor">
        <form className={editingId === null ? "message-form atelier-composer" : "message-form atelier-composer is-editing"} id="postcard-composer" onSubmit={submit}>
          <div className="form-title"><span>01</span><div><h2>{editingId === null ? "A note, just for her" : "A little finishing touch"}</h2><p>{editingId === null ? "There’s no perfect thing to say. Just your thing." : "You’re polishing a postcard already on the wall."}</p></div></div>

          <div className="studio-live-preview atelier-postcard" aria-label="Live postcard preview"><div className="studio-preview-top"><span>CARTE POSTALE · OTTAWA → PARIS</span><i>{stamp}</i></div><div className="studio-preview-mark" aria-hidden="true">◯ <small>20 · 08 · 26</small></div><span className="preview-quote" aria-hidden="true">“</span><p>{message || "A tiny corner of the world, waiting for your words…"}</p>{media.length > 0 && <PostcardMediaGallery items={media} variant="preview" label="Selected postcard photos and GIFs"/>}{stickers.length > 0 && <div className="postcard-sticker-row preview-stickers" aria-label="Selected postcard stickers">{stickers.map(item => <span key={item.symbol} title={item.label}>{item.symbol}</span>)}</div>}<footer><div><b>{name || "Your name"}</b><small>{role || "a teammate or colleague"}</small></div><span className="preview-seal" aria-hidden="true">K</span></footer></div>

          {draftRestored && editingId === null && <div className="draft-note">Your unfinished postcard was saved. <button type="button" onClick={() => { resetForm(); setStatus(""); }}>Start fresh</button></div>}

          <div className="writing-prompts"><span>Need a place to begin?</span><div>{PROMPTS.map(prompt => <button key={prompt.label} type="button" onClick={() => choosePrompt(prompt.starter)}><i aria-hidden="true">{prompt.mark}</i> {prompt.label}</button>)}</div></div>

          <div className="composer-identities"><label>Your name<input value={name} onChange={event => setName(event.target.value)} maxLength={60} required autoComplete="name" placeholder="e.g. Ernest"/></label><label>You are her…<input value={role} onChange={event => setRole(event.target.value)} maxLength={80} required placeholder="teammate, colleague…"/></label></div>
          <label className="composer-message-label">The part she’ll remember<textarea ref={textareaRef} value={message} onChange={event => setMessage(event.target.value)} minLength={3} maxLength={900} rows={7} required placeholder="Tell her a story. Thank her for something. Wish her the kind of magic you hope she finds in Paris…"/><small>{message.length}/900</small></label>
          <div className="composer-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, message.length / 9)}%` }}/><span>{wordCount ? `${wordCount} word${wordCount === 1 ? "" : "s"} ready for her next chapter` : "Every good story begins somewhere"}</span></div>

          <section className="postcard-personalize" aria-label="Personalize your postcard">
            <div className="personalize-heading"><div><span>Add a personal touch</span><small>Photos, GIFs, emoji, and stickers.</small></div><span className="personalize-limit">{media.length}/{MAX_POSTCARD_MEDIA} images</span></div>
            <input ref={fileInputRef} className="postcard-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple aria-hidden="true" tabIndex={-1} onChange={event => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ""; if (files.length) void addPostcardFiles(files); }}/>
            <div className="personalize-toolbar" aria-label="Postcard customization tools">
              <button className={activeTool === "photo" ? "personalize-tool is-selected" : "personalize-tool"} type="button" aria-expanded={activeTool === "photo"} disabled={uploading} onClick={() => { setActiveTool(current => current === "photo" ? null : "photo"); setToolMessage(""); }}><span aria-hidden="true">▧</span><span>Photo</span></button>
              <button className={activeTool === "gif" ? "personalize-tool is-selected" : "personalize-tool"} type="button" aria-expanded={activeTool === "gif"} disabled={media.length >= MAX_POSTCARD_MEDIA} onClick={() => { setActiveTool(current => current === "gif" ? null : "gif"); setToolMessage(""); }}><span aria-hidden="true">▷</span><span>GIF</span></button>
              <button className={activeTool === "emoji" ? "personalize-tool is-selected" : "personalize-tool"} type="button" aria-expanded={activeTool === "emoji"} onClick={() => { setActiveTool(current => current === "emoji" ? null : "emoji"); setToolMessage(""); }}><span aria-hidden="true">☺</span><span>Emoji</span></button>
              <button className={activeTool === "sticker" ? "personalize-tool is-selected" : "personalize-tool"} type="button" aria-expanded={activeTool === "sticker"} onClick={() => { setActiveTool(current => current === "sticker" ? null : "sticker"); setToolMessage(""); }}><span aria-hidden="true">◌</span><span>Sticker</span></button>
            </div>

            {activeTool === "photo" && <div
              className={`photo-dropzone${draggingPhoto ? " is-dragging" : ""}${uploading ? " is-uploading" : ""}${media.length >= MAX_POSTCARD_MEDIA ? " is-complete" : ""}`}
              role="button"
              tabIndex={media.length >= MAX_POSTCARD_MEDIA ? -1 : 0}
              aria-disabled={uploading || media.length >= MAX_POSTCARD_MEDIA}
              aria-busy={uploading}
              onClick={choosePhoto}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choosePhoto(); } }}
              onDragEnter={event => { event.preventDefault(); if (!uploading && media.length < MAX_POSTCARD_MEDIA) setDraggingPhoto(true); }}
              onDragOver={event => event.preventDefault()}
              onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingPhoto(false); }}
              onDrop={event => { event.preventDefault(); setDraggingPhoto(false); if (!uploading) void addPostcardFiles(event.dataTransfer.files); }}
              onPaste={event => { if (event.clipboardData.files.length && !uploading) { event.preventDefault(); void addPostcardFiles(event.clipboardData.files); } }}
            >
              <span className="photo-dropzone-icon" aria-hidden="true"><i/></span>
              <strong>{uploading ? "Preparing your photograph…" : media.length >= MAX_POSTCARD_MEDIA ? "Your photographs are ready" : draggingPhoto ? "Leave it right here" : "Add a photograph"}</strong>
              <span>{media.length >= MAX_POSTCARD_MEDIA ? "Remove one below to choose another." : "Drop, paste, or choose one from your device."}</span>
              {media.length < MAX_POSTCARD_MEDIA && <small>JPG, PNG, WEBP OR GIF · UP TO 20 MB</small>}
            </div>}
            {activeTool === "gif" && <div className="personalize-panel gif-panel"><label htmlFor="postcard-gif-url">Paste a GIPHY or Tenor link</label><div><input id="postcard-gif-url" type="url" value={gifUrl} onChange={event => setGifUrl(event.target.value)} placeholder="https://giphy.com/gifs/…" onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addGif(); } }}/><button type="button" onClick={addGif}>Add GIF</button></div><a href="https://giphy.com/search/paris" target="_blank" rel="noreferrer">Find a Paris GIF on GIPHY ↗</a></div>}
            {activeTool === "emoji" && <div className="personalize-panel emoji-panel" aria-label="Choose an emoji">{POSTCARD_EMOJIS.map(emoji => <button key={emoji} type="button" aria-label={`Add ${emoji} to your message`} onClick={() => addEmoji(emoji)}>{emoji}</button>)}</div>}
            {activeTool === "sticker" && <div className="personalize-panel sticker-panel" aria-label="Choose a postcard sticker">{POSTCARD_STICKERS.map(sticker => <button className={stickers.some(item => item.symbol === sticker.symbol) ? "is-selected" : ""} key={sticker.symbol} type="button" aria-pressed={stickers.some(item => item.symbol === sticker.symbol)} onClick={() => toggleSticker(sticker)}><span aria-hidden="true">{sticker.symbol}</span><small>{sticker.label}</small></button>)}</div>}

            {media.length > 0 && <div className="photo-collection" aria-label="Photographs selected for your postcard"><div className="photo-collection-heading"><span>On your postcard</span><small>{media.length === 1 ? "One moment to remember" : "Two moments to remember"}</small></div><div className="photo-collection-grid">{media.map(item => <article className="photo-selection" key={item.src}><div className="photo-selection-image"><img src={item.src} alt={item.label}/></div><div className="photo-selection-caption"><span>{item.kind === "gif" ? "Animated GIF" : "Photograph"}</span><button type="button" onClick={() => removePhoto(item)} aria-label={`Remove ${item.label}`}>×</button></div></article>)}</div></div>}
            {stickers.length > 0 && <div className="selected-extras" aria-label="Selected postcard stickers">{stickers.map(item => <button className="selected-extra sticker-extra" key={item.symbol} type="button" onClick={() => toggleSticker(item)}><span aria-hidden="true">{item.symbol}</span><i aria-hidden="true">×</i><span className="sr-only">Remove {item.label}</span></button>)}</div>}
            {toolMessage && <p className="personalize-message" role="status">{toolMessage}</p>}
          </section>

          <fieldset className="stamp-picker"><legend>Choose a finishing touch</legend><div>{STAMPS.map(option => <button className={stamp === option.label ? "stamp-option is-selected" : "stamp-option"} type="button" key={option.label} aria-pressed={stamp === option.label} onClick={() => setStamp(option.label)}><i aria-hidden="true">{option.mark}</i><span>{option.label}</span></button>)}</div></fieldset>

          <div className="composer-actions">{editingId !== null && <button className="cancel-edit" type="button" onClick={() => { resetForm(); setStatus(""); }}>Cancel edit</button>}<button className="publish-button" type="submit" disabled={busy || uploading}>{busy ? "Sealing your postcard…" : editingId === null ? "Add to Krystyna’s farewell" : "Save this little masterpiece"}<span aria-hidden="true">→</span></button></div>
          <p className={`form-status ${statusTone}`} aria-live="polite">{status || (editingId === null && (name || role || message) ? "Your draft stays safe on this device." : "")}</p>
        </form>

        <aside className="message-list atelier-wall">
          <div className="form-title"><span>02</span><div><h2>Messages from the team</h2><p>{loading ? "Gathering everyone’s words…" : `${messages.length} postcard${messages.length === 1 ? "" : "s"}, each one entirely hers`}</p></div></div>
          <div className="wall-moment"><span>FOR KRYSTYNA · FROM THE TEAM</span><strong>{loading ? "··" : String(messages.length).padStart(2, "0")}</strong><small>{messages.length === 1 ? "thoughtful note" : "thoughtful notes"} on their way to Paris</small>{contributorNames.length > 0 && <div className="contributor-stack" aria-label={`${contributorNames.length} contributors`}>{contributorNames.slice(0, 5).map(contributor => <span key={contributor} title={contributor}>{contributor.charAt(0).toUpperCase()}</span>)}{contributorNames.length > 5 && <span>+{contributorNames.length - 5}</span>}</div>}</div>
          <p className="wall-help">Postcards appear on Krystyna’s farewell immediately.</p>
          {loading ? <div className="postcard-loading" aria-label="Loading postcards"><i/><i/><i/></div> : messages.length === 0 ? <div className="empty-state atelier-empty"><div className="empty-envelope" aria-hidden="true"><i>K</i></div><b>The first page is yours.</b><p>Someone always has to begin the beautiful part.</p></div> : <div className="wall-postcards">{messages.map((item, index) => <article className={editingId === item.id ? "studio-note is-active" : "studio-note"} key={item.id} onPointerEnter={sound.playPaper}><div className="studio-note-top"><span>{item.stamp}</span><small>NO. {String(index + 1).padStart(2, "0")}</small></div><p>“{item.text}”</p>{item.media?.length > 0 && <PostcardMediaGallery items={item.media} variant="wall" label="Postcard photos and GIFs" lazy/>}{item.stickers?.length > 0 && <div className="postcard-sticker-row wall-stickers" aria-label="Postcard stickers">{item.stickers.map((sticker, stickerIndex) => <span key={`${sticker.symbol}-${stickerIndex}`} title={sticker.label}>{sticker.symbol}</span>)}</div>}<footer><div><b>{item.name}</b><small>{item.role}</small></div><div className="studio-note-actions"><button type="button" onClick={() => beginEdit(item)}>Refine</button><button className="remove-note" type="button" onClick={() => setDeleteCandidate(item.id)}>Remove</button></div></footer>{deleteCandidate === item.id && <div className="delete-confirm" role="alert"><p>Remove {item.name}’s postcard?</p><div><button type="button" onClick={() => setDeleteCandidate(null)}>Keep it</button><button className="confirm-remove" type="button" disabled={busy} onClick={() => void remove(item.id)}>Yes, remove</button></div></div>}</article>)}</div>}
          <button className="wall-invite" type="button" onClick={() => void copyStudioLink()}><span>{copied ? "The studio link has been copied." : "Invite another teammate"}</span><i aria-hidden="true">↗</i></button>
        </aside>
      </section>

      <footer className="studio-footer atelier-footer"><span className="footer-script">pour Krystyna,</span><p>A thoughtful send-off for a remarkable teammate.</p><div><span>OTTAWA</span><i aria-hidden="true">✈</i><span>PARIS</span></div><small>ASSEMBLED QUIETLY, BY THE TEAM WHO WILL MISS HER · 2026</small></footer>
    </main>
  );
}
