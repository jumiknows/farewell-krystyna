"use client";

import { useEffect, useState } from "react";
import { useFarewellSound } from "./use-farewell-sound";

const starterNotes = [
  { name: "Ernest", role: "your teammate", text: "Thank you for bringing so much kindness, curiosity, and joy to our team. France is so lucky to have you—and we are going to miss you more than this little postcard can say.", stamp: "WITH LOVE" },
  { name: "Your teammates", role: "the whole crew", text: "You made ordinary workdays brighter, meetings warmer, and every win more meaningful. We cannot wait to see what beautiful things you do next.", stamp: "MERCI" },
  { name: "Your work family", role: "always cheering for you", text: "May your next chapter be filled with buttery croissants, brave adventures, wonderful people, and a thousand reasons to smile.", stamp: "BON VOYAGE" },
];

type Message = { id?: number; name: string; role: string; text: string; stamp: string };

export default function Home() {
  const [opened, setOpened] = useState(false);
  const [finale, setFinale] = useState(false);
  const [notes, setNotes] = useState<Message[]>(starterNotes);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const sound = useFarewellSound(0.24);
  useEffect(() => { if (!finale) return; const timer = window.setTimeout(() => setFinale(false), 5200); return () => window.clearTimeout(timer); }, [finale]);
  useEffect(() => { if (window.location.hash) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); }, []);
  useEffect(() => { fetch("/api/messages", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(data => { if (data?.messages?.length) setNotes(data.messages); }).catch(() => null).finally(() => setLoadingNotes(false)); }, []);
  useEffect(() => {
    if (!opened) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpened(false); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKeyDown); };
  }, [opened]);
  function scrollToSection(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }
  return (
    <main onClickCapture={event => { if ((event.target as HTMLElement).closest("button")) sound.playClick(); }}>
      <div className="paper-grain" />
      <nav className="topbar" aria-label="Farewell navigation"><a className="wordmark" href="/">pour Krystyna <span>♥</span></a><div className="navlinks"><button type="button" onClick={() => scrollToSection("memories")}>Postcards</button><button type="button" onClick={() => scrollToSection("paris")}>Paris awaits</button></div></nav>
      <aside className="sound-control" aria-label="Farewell sound controls"><button onClick={sound.enabled ? sound.stop : sound.start} aria-pressed={sound.enabled} aria-label={sound.enabled ? "Mute all sounds" : "Turn on music and tactile sounds"}><span className={sound.enabled ? "sound-wave active" : "sound-wave"}>♪</span>{sound.enabled ? "Sound on" : "Add sound"}</button>{sound.enabled && <label><span className="sr-only">Master sound volume</span><input type="range" min="0" max="0.5" step="0.01" value={sound.volume} onChange={event => sound.setVolume(Number(event.target.value))}/></label>}</aside>
      <section className="hero" id="home">
        <div className="sun" />
        <div className="hero-copy"><p className="eyebrow">UNE PETITE LETTRE DE NOUS TOUS</p><h1>Au revoir,<br/><em>Krystyna!</em></h1><p className="intro">Some people leave a team. You leave behind a thousand little reasons to smile.</p><button className="primary" onClick={() => setOpened(true)}>Open your letter <span aria-hidden="true">→</span></button><p className="keepsake-note"><span aria-hidden="true">✦</span> A farewell keepsake from the people who will miss you</p></div>
        <div className="paris-scene" role="img" aria-label="A handcrafted illustration of the Eiffel Tower beneath a Paris moon"><div className="postcard-card"><span>PARIS</span><small>48.8566° N, 2.3522° E</small></div><div className="moon" aria-hidden="true">☾</div><div className="tower" aria-hidden="true"/><div className="skyline" aria-hidden="true"><i/><i/><i/><i/><i/></div><div className="flight-path" aria-hidden="true">· · · · · · ✈</div></div>
        <p className="scroll-note">SCROLL FOR A LITTLE PARIS MAGIC ↓</p>
      </section>
      {opened && <div className="letter-overlay" role="dialog" aria-modal="true" aria-labelledby="farewell-letter-title" onMouseDown={event => { if (event.target === event.currentTarget) setOpened(false); }}><button className="close" autoFocus onClick={() => setOpened(false)} aria-label="Close farewell letter">×</button><article className="letter"><div className="letter-date">OTTAWA · AUGUST 2026</div><h2 id="farewell-letter-title">Chère Krystyna,</h2><p>You brought a rare kind of light to our team—the kind that makes people feel welcome, makes hard days easier, and turns colleagues into friends.</p><p>We’re so excited for the life waiting for you in France. Go wander down tiny streets, find your favourite café, say yes to new adventures, and know that a whole group of people back here will always be cheering you on.</p><p className="letter-sign">With so much love,<br/><strong>Your team</strong> ♥</p><div className="wax" aria-hidden="true">K</div></article></div>}
      <section className="messages" id="memories"><div className="section-heading"><p className="eyebrow">POSTCARDS FROM HOME</p><h2>A few things we hope<br/>you’ll take with you</h2><p>{loadingNotes ? "Gathering everyone’s words…" : `${notes.length} note${notes.length === 1 ? "" : "s"} for the big adventure ahead.`}</p></div><div className="cards">{notes.map((note, i) => <article className={`note note-${(i % 3) + 1}`} key={note.id ?? `${note.name}-${i}`} onPointerEnter={sound.playPaper}><div className="stamp">{note.stamp}</div><div className="postmark" aria-hidden="true">◯<br/><span>17.08.26</span></div><span className="quote" aria-hidden="true">“</span><p>{note.text}</p><footer><b>{note.name}</b><small>{note.role}</small></footer></article>)}</div></section>
      <section className="paris" id="paris"><div className="paris-inner"><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>Paris is waiting<br/>for you.</h2><p className="paris-copy">For the morning cafés. The golden evenings. The people you haven’t met yet. The stories you’ll tell us when we see you again.</p><div className="wish-row"><span>joy</span><i>✦</i><span>courage</span><i>✦</i><span>adventure</span><i>✦</i><span>home</span></div><button className="final-button" onClick={() => setFinale(true)}>Send Krystyna some love ♥</button></div><div className="arc"/></section>
      <footer className="footer"><div><span>Ottawa</span><b>→</b><span>Paris</span></div><p>Not goodbye. Just <em>à bientôt.</em></p><small>MADE WITH LOVE BY YOUR TEAM · 2026</small></footer>
      {finale && <div className="finale" aria-live="polite"><div className="confetti">✦ ♥ ✧ ♥ ✦</div><div className="heart">♥</div><h2>Bon voyage, Krystyna!</h2><p>Paris is lucky to have you.</p></div>}
    </main>
  );
}
