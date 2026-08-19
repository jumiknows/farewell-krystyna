"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFarewellSound } from "./use-farewell-sound";
import { ParisMagic } from "./paris-magic";
import { PostcardMediaGallery } from "./postcard-media-gallery";
import type { PostcardMessage } from "./postcard-media";

export default function Home() {
  const [started, setStarted] = useState(false);
  const [openingGift, setOpeningGift] = useState(false);
  const [opened, setOpened] = useState(false);
  const [finale, setFinale] = useState(false);
  const [magicBurst, setMagicBurst] = useState(0);
  const [notes, setNotes] = useState<PostcardMessage[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [noteLoadError, setNoteLoadError] = useState(false);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);
  const [readerTurn, setReaderTurn] = useState(0);
  const [galleryStart, setGalleryStart] = useState(0);
  const [visiblePostcards, setVisiblePostcards] = useState(3);
  const postcardRail = useRef<HTMLDivElement>(null);
  const sound = useFarewellSound();
  const playPaper = sound.playPaper;
  useEffect(() => { if (!finale) return; const timer = window.setTimeout(() => setFinale(false), 5200); return () => window.clearTimeout(timer); }, [finale]);
  useEffect(() => { if (window.location.hash) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); }, []);
  useEffect(() => {
    function updateVisiblePostcards() {
      setVisiblePostcards(window.innerWidth <= 850 ? 1 : window.innerWidth <= 1100 ? 2 : 3);
    }
    updateVisiblePostcards();
    window.addEventListener("resize", updateVisiblePostcards);
    return () => window.removeEventListener("resize", updateVisiblePostcards);
  }, []);
  useEffect(() => {
    if (started) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [started]);
  useEffect(() => {
    fetch("/api/messages", { cache: "no-store" })
      .then(response => {
        if (!response.ok) throw new Error("Unable to load postcards");
        return response.json();
      })
      .then(data => setNotes(Array.isArray(data.messages) ? data.messages : []))
      .catch(() => setNoteLoadError(true))
      .finally(() => setLoadingNotes(false));
  }, []);
  useEffect(() => {
    if (!opened) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpened(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKeyDown); };
  }, [opened]);
  useEffect(() => {
    if (selectedNoteIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedNoteIndex(null);
      const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      if (direction && notes.length > 1) {
        playPaper();
        setReaderTurn(value => value + 1);
        setSelectedNoteIndex(current => current === null ? 0 : (current + direction + notes.length) % notes.length);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedNoteIndex, notes.length, playPaper]);
  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
  }
  function beginReveal(withSound: boolean) {
    if (withSound) sound.start();
    setOpeningGift(true);
    window.setTimeout(() => { if (withSound) sound.playEnvelope(); }, 120);
    window.setTimeout(() => { setStarted(true); setOpeningGift(false); setOpened(true); }, 1450);
  }
  function revealPostcards() {
    sound.playPaper();
    setOpened(false);
    window.setTimeout(() => scrollToSection("memories"), 220);
  }
  function openPostcard(index: number) {
    sound.playPaper();
    setReaderTurn(value => value + 1);
    setSelectedNoteIndex(index);
  }
  function turnPostcard(direction: number) {
    if (notes.length < 2) return;
    sound.playPaper();
    setReaderTurn(value => value + 1);
    setSelectedNoteIndex(current => current === null ? 0 : (current + direction + notes.length) % notes.length);
  }
  function trackPostcardPosition() {
    const rail = postcardRail.current;
    const first = rail?.querySelector<HTMLElement>(".note");
    if (!rail || !first) return;
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    setGalleryStart(Math.round(rail.scrollLeft / (first.offsetWidth + gap)));
  }
  function browsePostcards(direction: number) {
    const rail = postcardRail.current;
    if (!rail) return;
    const next = Math.max(0, Math.min(galleryStart + direction * visiblePostcards, notes.length - visiblePostcards));
    const postcard = rail.children.item(next) as HTMLElement | null;
    if (!postcard) return;
    sound.playPaper();
    rail.scrollTo({ left: postcard.offsetLeft, behavior: "smooth" });
    setGalleryStart(next);
  }
  return (
    <main
      onPointerOverCapture={event => { if (event.pointerType === "mouse" && (event.target as HTMLElement).closest("button:not(:disabled)")) sound.playSelect(); }}
      onFocusCapture={event => { if ((event.target as HTMLElement).closest("button:not(:disabled)")) sound.playSelect(); }}
      onClickCapture={event => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button:not(:disabled)"); if (button && button.dataset.sound !== "confirm") sound.playPress(); }}
    >
      <div className="paper-grain" />
      <ParisMagic active={started} finale={magicBurst} />
      {!started && <section className={openingGift ? "reveal-gate is-opening" : "reveal-gate"} aria-label="Begin Krystyna’s farewell surprise">
        <div className="reveal-postage"><span>PRIVATE CORRESPONDENCE</span><i aria-hidden="true">·</i><span>20 AUG 2026</span></div>
        <div className="reveal-content">
          <div className="envelope-wrap" aria-hidden="true"><div className="envelope"><div className="envelope-letter">K</div><div className="envelope-flap"/><div className="envelope-front"/><div className="envelope-seal">K</div></div></div>
          <p className="eyebrow">A LITTLE SOMETHING FROM ALL OF US</p>
          <h1>For Krystyna,<br/><em>from the team.</em></h1>
          <p className="reveal-intro">Put your sound on. This one is meant to be opened slowly.</p>
          <div className="reveal-actions"><button className="primary" onClick={() => beginReveal(true)} disabled={openingGift}>Open with sound <span aria-hidden="true">♪</span></button><button className="quiet-button" onClick={() => beginReveal(false)} disabled={openingGift}>Open quietly</button></div>
        </div>
        <div className="reveal-route" aria-hidden="true"><span>OTTAWA</span><i>·········· ✈ ··········</i><span>PARIS</span></div>
      </section>}
      <nav className="topbar" aria-label="Farewell navigation"><Link className="wordmark" href="/">pour Krystyna</Link><div className="navlinks"><button type="button" onClick={() => scrollToSection("memories")}>Postcards</button><button type="button" onClick={() => scrollToSection("paris")}>Paris awaits</button></div></nav>
      <aside className={sound.enabled ? "sound-control is-playing" : "sound-control"} aria-label="Farewell sound controls">
        <div className="sound-meta"><span>{sound.enabled ? "Now playing" : "Café soundtrack"}</span><strong>A café in Paris</strong></div>
        <button onClick={sound.enabled ? sound.stop : sound.start} aria-pressed={sound.enabled} aria-label={sound.enabled ? "Mute all sounds" : "Play the Paris café soundtrack"}><span className={sound.enabled ? "sound-wave active" : "sound-wave"}>{sound.enabled ? "Ⅱ" : "▶"}</span>{sound.enabled ? "Pause" : "Play"}</button>
        {sound.enabled && <label><span className="sr-only">Master sound volume</span><input type="range" min="0" max="0.5" step="0.01" value={sound.volume} onChange={event => sound.setVolume(Number(event.target.value))}/></label>}
      </aside>
      <section className="hero" id="home">
        <div className="sun" />
        <div className="hero-copy"><p className="eyebrow">UNE PETITE LETTRE DE NOUS TOUS</p><h1>Au revoir,<br/><em>Krystyna!</em></h1><p className="intro">Some people leave a team. You leave behind a thousand little reasons to smile.</p><button className="primary" onClick={() => { sound.playEnvelope(); setOpened(true); }}>Open your letter <span aria-hidden="true">→</span></button><p className="keepsake-note">A farewell keepsake from your team.</p></div>
        <div className="paris-scene" role="img" aria-label="A handcrafted illustration of the Eiffel Tower beneath a Paris moon"><div className="postcard-card"><span>PARIS</span><small>48.8566° N, 2.3522° E</small></div><div className="moon" aria-hidden="true">☾</div><div className="tower" aria-hidden="true"/><div className="skyline" aria-hidden="true"><i/><i/><i/><i/><i/></div><div className="flight-path" aria-hidden="true">· · · · · · ✈</div></div>
        <p className="scroll-note">SCROLL FOR A LITTLE PARIS MAGIC ↓</p>
      </section>
      {opened && <div className="letter-overlay" role="dialog" aria-modal="true" aria-labelledby="farewell-letter-title"><button className="close" autoFocus onClick={() => setOpened(false)} aria-label="Close farewell letter">×</button><article className="letter"><div className="letter-date">OTTAWA · 20 AUGUST 2026</div><h2 id="farewell-letter-title">Chère Krystyna,</h2><p>You brought a rare kind of light to our team—the kind that makes people feel welcome, makes hard days easier, and turns colleagues into friends.</p><p>We’re so excited for the life waiting for you in France. Go wander down tiny streets, find your favourite café, say yes to new adventures, and know that a whole group of people back here will always be cheering you on.</p><p className="letter-sign">Wishing you all the best,<br/><strong>Your team</strong></p><button className="letter-next" onClick={revealPostcards}>Read your postcards <span aria-hidden="true">→</span></button><div className="wax" aria-hidden="true">K</div></article></div>}
      <section className="messages" id="memories">
        <div className="section-heading"><p className="eyebrow">POSTCARDS FROM HOME · CHAPTER TWO</p><h2>A few things we hope<br/>you’ll take with you</h2><p>{loadingNotes ? "Gathering everyone’s words…" : noteLoadError ? "The post is taking the scenic route. Please try again shortly." : `${notes.length} note${notes.length === 1 ? "" : "s"} for the big adventure ahead.`}</p></div>
        {loadingNotes ? <div className="recipient-loading" aria-label="Loading postcards"><i/><i/><i/></div> : noteLoadError ? <div className="recipient-empty"><span>◯</span><p>We couldn’t gather the postcards just yet.</p><button onClick={() => window.location.reload()}>Try again</button></div> : notes.length === 0 ? <div className="recipient-empty"><span>◯</span><p>The first postcard is still being written.</p></div> : <div className="postcard-gallery">
          <div className="cards" ref={postcardRail} onScroll={trackPostcardPosition} aria-label={`${notes.length} postcards from the team`}>
            {notes.map((note, i) => {
              const longNote = note.text.length > (note.media?.length ? 145 : 215);
              return <article className={`note note-${(i % 3) + 1}${note.media?.length ? " note-has-media" : ""}${longNote ? " note-is-excerpt" : ""}`} key={note.id ?? `${note.name}-${i}`} tabIndex={0} role="button" aria-label={`Open postcard ${i + 1} of ${notes.length} from ${note.name}`} onClick={() => openPostcard(i)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPostcard(i); } }} onPointerEnter={sound.playPaper}>
                <div className="stamp">{note.stamp}</div>
                <div className="postmark" aria-hidden="true">◯<br/><span>20.08.26</span></div>
                <span className="quote" aria-hidden="true">“</span>
                <p className="postcard-excerpt">{note.text}</p>
                {note.media?.length > 0 && <PostcardMediaGallery items={note.media} variant="recipient" label="Postcard photos and GIFs" lazy/>}
                {note.stickers?.length > 0 && <div className="postcard-sticker-row" aria-label="Postcard stickers">{note.stickers.map((sticker, index) => <span key={`${sticker.symbol}-${index}`} title={sticker.label}>{sticker.symbol}</span>)}</div>}
                <footer><div><b>{note.name}</b><small>{note.role}</small></div><span className="note-open-hint">{longNote ? "Read the full note" : "Open postcard"} <i aria-hidden="true">↗</i></span></footer>
              </article>;
            })}
          </div>
          {notes.length > visiblePostcards && <nav className="postcard-navigation" aria-label="Browse team postcards"><span className="postcard-position">{String(galleryStart + 1).padStart(2, "0")} <i aria-hidden="true">/</i> {String(notes.length).padStart(2, "0")}</span><div><button type="button" onClick={() => browsePostcards(-1)} disabled={galleryStart === 0} aria-label="Previous postcards">←</button><button type="button" onClick={() => browsePostcards(1)} disabled={galleryStart >= notes.length - visiblePostcards} aria-label="Next postcards">→</button></div></nav>}
        </div>}
        {!loadingNotes && !noteLoadError && notes.length > 0 && <button className="chapter-next" onClick={() => { sound.playPaper(); scrollToSection("paris"); }}>One last stop: Paris <span aria-hidden="true">→</span></button>}
      </section>
      <section className="paris" id="paris"><div className="paris-inner"><p className="eyebrow">THE FINALE · YOUR NEXT CHAPTER</p><h2>Paris is waiting<br/>for you.</h2><p className="paris-copy">For the morning cafés. The golden evenings. The people you haven’t met yet. The stories you’ll tell us when we see you again.</p><div className="wish-row"><span>joy</span><i>·</i><span>courage</span><i>·</i><span>adventure</span><i>·</i><span>home</span></div><button className="final-button" data-sound="confirm" onClick={() => { sound.playConfirm(); setMagicBurst(value => value + 1); setFinale(true); }}>Send Krystyna your best wishes <span aria-hidden="true">→</span></button></div><div className="arc"/></section>
      <footer className="footer"><div><span>Ottawa</span><b>→</b><span>Paris</span></div><p>Not goodbye. Just <em>à bientôt.</em></p><small>MADE FOR KRYSTYNA BY HER TEAM · 2026</small></footer>
      {selectedNoteIndex !== null && notes[selectedNoteIndex] && <div className="note-reader" role="dialog" aria-modal="true" aria-labelledby="focused-postcard-author" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedNoteIndex(null); }}>
        <div className="reader-orbit reader-orbit-one" aria-hidden="true"/><div className="reader-orbit reader-orbit-two" aria-hidden="true"/>
        <button className="note-reader-close" autoFocus onClick={() => setSelectedNoteIndex(null)} aria-label="Close postcard">× <span>Close</span></button>
        <div className={notes.length === 1 ? "reader-stage is-single" : "reader-stage"}>
          {notes.length > 1 && <button className="reader-arrow reader-prev" onClick={() => turnPostcard(-1)} aria-label="Previous postcard">←</button>}
          <article className={notes[selectedNoteIndex].text.length > 420 ? "focused-postcard focused-postcard-long" : "focused-postcard"} key={readerTurn}>
            <div className="focused-postcard-top"><div><span>POSTCARD</span><small>OTTAWA → PARIS</small></div><div className="focused-stamp">{notes[selectedNoteIndex].stamp}</div></div>
            <div className="focused-postmark" aria-hidden="true">◯<br/><span>20 · 08 · 26</span></div>
            <span className="focused-quote" aria-hidden="true">“</span>
            <div className="focused-postcard-body" role="region" aria-label={`Complete message from ${notes[selectedNoteIndex].name}`} tabIndex={0}><p>{notes[selectedNoteIndex].text}</p>{notes[selectedNoteIndex].media?.length > 0 && <PostcardMediaGallery items={notes[selectedNoteIndex].media} variant="focused" label="Postcard photos and GIFs"/>}{notes[selectedNoteIndex].stickers?.length > 0 && <div className="postcard-sticker-row focused-stickers" aria-label="Postcard stickers">{notes[selectedNoteIndex].stickers.map((sticker, index) => <span key={`${sticker.symbol}-${index}`} title={sticker.label}>{sticker.symbol}</span>)}</div>}</div>
            <footer><div><small>A NOTE FROM</small><b id="focused-postcard-author">{notes[selectedNoteIndex].name}</b><span>{notes[selectedNoteIndex].role}</span></div><i aria-hidden="true">K</i></footer>
          </article>
          {notes.length > 1 && <button className="reader-arrow reader-next" onClick={() => turnPostcard(1)} aria-label="Next postcard">→</button>}
        </div>
        <div className="reader-progress"><span>{String(selectedNoteIndex + 1).padStart(2, "0")}</span><i/><span>{String(notes.length).padStart(2, "0")}</span><small>{notes.length === 1 ? "One postcard, from your team." : "Use ← → to wander through the postcards"}</small></div>
      </div>}
      {finale && <div className="finale" aria-live="polite"><div className="arrival-card"><p className="arrival-kicker">ARRIVAL CONFIRMED · BON VOYAGE</p><div className="arrival-route"><div><small>FROM</small><b>YOW</b><span>Ottawa</span></div><i aria-hidden="true">✈</i><div><small>TO</small><b>CDG</b><span>Paris</span></div></div><div className="arrival-rule"/><h2>Bon voyage,<br/>Krystyna!</h2><p>{notes.length} thoughtful note{notes.length === 1 ? "" : "s"}, one extraordinary next chapter, and a whole team cheering you on.</p><div className="arrival-footer"><span>20 AUG 2026</span><strong>À BIENTÔT</strong></div></div></div>}
    </main>
  );
}
