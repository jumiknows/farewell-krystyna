"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useFarewellSound } from "../use-farewell-sound";

type Message = { id: number; name: string; role: string; text: string; stamp: string };
type StatusTone = "neutral" | "success" | "error";

export default function StudioClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [stamp, setStamp] = useState("WITH LOVE");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null);
  const sound = useFarewellSound(0.18);

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

  function resetForm() {
    setName("");
    setRole("");
    setMessage("");
    setStamp("WITH LOVE");
    setEditingId(null);
  }

  function beginEdit(item: Message) {
    setEditingId(item.id);
    setDeleteCandidate(null);
    setName(item.name);
    setRole(item.role);
    setMessage(item.text);
    setStamp(item.stamp);
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
        body: JSON.stringify({ id: editingId ?? undefined, name, role, message, stamp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      const wasEditing = editingId !== null;
      resetForm();
      setStatusTone("success");
      setStatus(wasEditing ? "Postcard updated beautifully ♥" : "Your postcard is now part of Krystyna’s farewell ♥");
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
      <aside className="sound-control" aria-label="Studio sound controls"><button onClick={sound.enabled ? sound.stop : sound.start} aria-pressed={sound.enabled} aria-label={sound.enabled ? "Mute all sounds" : "Turn on music and tactile sounds"}><span className={sound.enabled ? "sound-wave active" : "sound-wave"}>♪</span>{sound.enabled ? "Sound on" : "Add sound"}</button>{sound.enabled && <label><span className="sr-only">Master sound volume</span><input type="range" min="0" max="0.5" step="0.01" value={sound.volume} onChange={event => sound.setVolume(Number(event.target.value))}/></label>}</aside>
      <header className="studio-header">
        <div>
          <p className="eyebrow">THE TEAM’S WRITING ROOM</p>
          <h1>A postcard for<br/><em>Krystyna.</em></h1>
          <p className="studio-intro">Share a memory, a thank-you, or one beautiful wish for her next chapter in France.</p>
          <div className="studio-access"><span aria-hidden="true">✦</span> No account needed · everyone with this link can contribute</div>
          <div className="studio-deadline"><span>Last day</span><strong>20 August 2026</strong></div>
        </div>
        <Link className="preview-link" href="/" target="_blank" rel="noreferrer">View Krystyna’s farewell <span aria-hidden="true">↗</span></Link>
      </header>

      <section className="studio-grid" aria-label="Farewell message editor">
        <form className={editingId === null ? "message-form" : "message-form is-editing"} id="postcard-composer" onSubmit={submit}>
          <div className="form-title"><span>01</span><div><h2>{editingId === null ? "Write from the heart" : "Refine this postcard"}</h2><p>{editingId === null ? "Preview it here before adding it to the farewell." : "You’re editing a postcard already on the wall."}</p></div></div>

          <div className="studio-live-preview" aria-label="Live postcard preview">
            <div className="studio-preview-top"><span>LIVE PREVIEW</span><i>{stamp}</i></div>
            <div className="studio-preview-mark" aria-hidden="true">◯ <small>20 · 08 · 26</small></div>
            <p>{message || "Your message will take shape here as you write…"}</p>
            <footer><b>{name || "Your name"}</b><small>{role || "your connection to Krystyna"}</small></footer>
          </div>

          <label>Your name<input value={name} onChange={event => setName(event.target.value)} maxLength={60} required autoComplete="name" placeholder="e.g. Ernest"/></label>
          <label>How Krystyna knows you<input value={role} onChange={event => setRole(event.target.value)} maxLength={80} required placeholder="e.g. teammate, coffee friend, mentor"/></label>
          <label>Your message<textarea value={message} onChange={event => setMessage(event.target.value)} minLength={3} maxLength={900} rows={8} required placeholder="A favourite memory, a sincere thank-you, or something you hope she carries with her…"/><small>{message.length}/900</small></label>
          <label>Postcard stamp<select value={stamp} onChange={event => setStamp(event.target.value)}><option>WITH LOVE</option><option>MERCI</option><option>BON VOYAGE</option><option>À BIENTÔT</option><option>PARIS AWAITS</option></select></label>
          <div className="composer-actions">
            {editingId !== null && <button className="cancel-edit" type="button" onClick={() => { resetForm(); setStatus(""); }}>Cancel edit</button>}
            <button className="publish-button" type="submit" disabled={busy}>{busy ? "Working…" : editingId === null ? "Add to Krystyna’s farewell" : "Save postcard changes"}<span aria-hidden="true">→</span></button>
          </div>
          <p className={`form-status ${statusTone}`} aria-live="polite">{status}</p>
        </form>

        <aside className="message-list">
          <div className="form-title"><span>02</span><div><h2>The postcard wall</h2><p>{loading ? "Gathering messages…" : `${messages.length} postcard${messages.length === 1 ? "" : "s"} collected so far`}</p></div></div>
          <p className="wall-help">Review the wall, make a correction, or remove an accidental duplicate. Changes appear on the farewell immediately.</p>
          {loading ? <div className="postcard-loading" aria-label="Loading postcards"><i/><i/><i/></div> : messages.length === 0 ? <div className="empty-state"><b>Be the first to write</b><p>Your postcard will appear here.</p></div> : messages.map((item, index) => (
            <article className={editingId === item.id ? "studio-note is-active" : "studio-note"} key={item.id} onPointerEnter={sound.playPaper}>
              <div className="studio-note-top"><span>{item.stamp}</span><small>{String(index + 1).padStart(2, "0")}</small></div>
              <p>“{item.text}”</p>
              <footer><div><b>{item.name}</b><small>{item.role}</small></div><div className="studio-note-actions"><button type="button" onClick={() => beginEdit(item)}>Edit</button><button className="remove-note" type="button" onClick={() => setDeleteCandidate(item.id)}>Remove</button></div></footer>
              {deleteCandidate === item.id && <div className="delete-confirm" role="alert"><p>Remove {item.name}’s postcard?</p><div><button type="button" onClick={() => setDeleteCandidate(null)}>Keep it</button><button className="confirm-remove" type="button" disabled={busy} onClick={() => void remove(item.id)}>Yes, remove</button></div></div>}
            </article>
          ))}
        </aside>
      </section>
      <footer className="studio-footer">Ottawa <span>→</span> Paris · assembled with love by the whole team</footer>
    </main>
  );
}
