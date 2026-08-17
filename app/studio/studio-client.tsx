"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useFarewellSound } from "../use-farewell-sound";

type Message = { id: number; name: string; role: string; text: string; stamp: string };

export default function StudioClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [stamp, setStamp] = useState("WITH LOVE");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const sound = useFarewellSound(0.18);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/messages", { cache: "no-store" });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch {
      setStatus("We couldn’t load the postcards. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("Adding your postcard…");
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, role, message, stamp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setMessage("");
      setStatus("Your message is now part of Krystyna’s farewell ♥");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number, author: string) {
    if (!window.confirm(`Remove ${author}’s postcard from the farewell?`)) return;
    setStatus("Removing postcard…");
    try {
      const response = await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setStatus("Postcard removed.");
      await load();
    } catch {
      setStatus("We couldn’t remove that postcard. Please try again.");
    }
  }

  return (
    <main className="studio-shell" onClickCapture={event => { if ((event.target as HTMLElement).closest("button")) sound.playClick(); }}>
      <aside className="sound-control" aria-label="Studio sound controls"><button onClick={sound.enabled ? sound.stop : sound.start} aria-pressed={sound.enabled} aria-label={sound.enabled ? "Mute all sounds" : "Turn on music and tactile sounds"}><span className={sound.enabled ? "sound-wave active" : "sound-wave"}>♪</span>{sound.enabled ? "Sound on" : "Add sound"}</button>{sound.enabled && <label><span className="sr-only">Master sound volume</span><input type="range" min="0" max="0.5" step="0.01" value={sound.volume} onChange={event => sound.setVolume(Number(event.target.value))}/></label>}</aside>
      <header className="studio-header">
        <div>
          <p className="eyebrow">THE TEAM’S WRITING ROOM</p>
          <h1>A postcard for<br/><em>Krystyna.</em></h1>
          <p className="studio-intro">Share a memory, a thank-you, or one beautiful wish for her next chapter in France.</p>
          <div className="studio-access"><span aria-hidden="true">✦</span> No account needed · everyone with this link can contribute</div>
        </div>
        <a className="preview-link" href="/" target="_blank" rel="noreferrer">View the farewell <span aria-hidden="true">↗</span></a>
      </header>

      <section className="studio-grid" aria-label="Farewell message editor">
        <form className="message-form" onSubmit={submit}>
          <div className="form-title"><span>01</span><div><h2>Write from the heart</h2><p>Your words will appear exactly as written.</p></div></div>
          <label>Your name<input value={name} onChange={event => setName(event.target.value)} maxLength={60} required autoComplete="name" placeholder="e.g. Ernest"/></label>
          <label>How Krystyna knows you<input value={role} onChange={event => setRole(event.target.value)} maxLength={80} required placeholder="e.g. teammate, coffee friend, mentor"/></label>
          <label>Your message<textarea value={message} onChange={event => setMessage(event.target.value)} minLength={3} maxLength={900} rows={8} required placeholder="A favourite memory, a sincere thank-you, or something you hope she carries with her…"/><small>{message.length}/900</small></label>
          <label>Postcard stamp<select value={stamp} onChange={event => setStamp(event.target.value)}><option>WITH LOVE</option><option>MERCI</option><option>BON VOYAGE</option><option>À BIENTÔT</option><option>PARIS AWAITS</option></select></label>
          <button className="publish-button" type="submit" disabled={busy}>{busy ? "Adding your postcard…" : "Add to Krystyna’s farewell"}<span aria-hidden="true">→</span></button>
          <p className="form-status" aria-live="polite">{status}</p>
        </form>

        <aside className="message-list">
          <div className="form-title"><span>02</span><div><h2>The postcard wall</h2><p>{loading ? "Gathering messages…" : `${messages.length} postcard${messages.length === 1 ? "" : "s"} collected so far`}</p></div></div>
          {loading ? <div className="postcard-loading" aria-label="Loading postcards"><i/><i/><i/></div> : messages.length === 0 ? <div className="empty-state"><b>Be the first to write</b><p>Your postcard will appear here.</p></div> : messages.map(item => (
            <article className="studio-note" key={item.id} onPointerEnter={sound.playPaper}>
              <div><span>{item.stamp}</span><button type="button" onClick={() => remove(item.id, item.name)} aria-label={`Remove message from ${item.name}`}>×</button></div>
              <p>“{item.text}”</p>
              <footer><b>{item.name}</b><small>{item.role}</small></footer>
            </article>
          ))}
        </aside>
      </section>
      <footer className="studio-footer">Ottawa <span>→</span> Paris · assembled with love by the whole team</footer>
    </main>
  );
}
