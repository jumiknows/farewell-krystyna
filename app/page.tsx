"use client";

import { useEffect, useRef, useState } from "react";

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
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.28);
  const audioRef = useRef<{ context: AudioContext; gain: GainNode; timer: number } | null>(null);
  useEffect(() => { if (!finale) return; const timer = window.setTimeout(() => setFinale(false), 5200); return () => window.clearTimeout(timer); }, [finale]);
  useEffect(() => { if (window.location.hash) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); }, []);
  useEffect(() => { fetch("/api/messages").then(r => r.ok ? r.json() : null).then(data => { if (data?.messages?.length) setNotes(data.messages); }).catch(() => null); }, []);
  useEffect(() => { if (audioRef.current) audioRef.current.gain.gain.setTargetAtTime(volume, audioRef.current.context.currentTime, .08); }, [volume]);

  function startMusic() {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioCtx();
    const gain = context.createGain(); gain.gain.value = volume; gain.connect(context.destination);
    const notesHz = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23, 261.63, 329.63, 392, 523.25];
    let step = 0;
    const playTone = () => { const now = context.currentTime; const osc = context.createOscillator(); const soft = context.createGain(); osc.type = "sine"; osc.frequency.value = notesHz[step++ % notesHz.length]; soft.gain.setValueAtTime(.0001, now); soft.gain.exponentialRampToValueAtTime(.12, now + .06); soft.gain.exponentialRampToValueAtTime(.0001, now + .72); osc.connect(soft).connect(gain); osc.start(now); osc.stop(now + .76); };
    playTone(); const timer = window.setInterval(playTone, 760); audioRef.current = { context, gain, timer }; setPlaying(true);
  }
  function stopMusic() { const audio = audioRef.current; if (audio) { window.clearInterval(audio.timer); audio.gain.gain.setTargetAtTime(0, audio.context.currentTime, .05); window.setTimeout(() => audio.context.close(), 180); } audioRef.current = null; setPlaying(false); }
  function scrollToSection(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }
  useEffect(() => () => { if (audioRef.current) { window.clearInterval(audioRef.current.timer); audioRef.current.context.close(); } }, []);
  return (
    <main>
      <div className="paper-grain" />
      <nav className="topbar"><a className="wordmark" href="/">pour Krystyna <span>♥</span></a><div className="navlinks"><button type="button" onClick={() => scrollToSection("memories")}>Messages</button><button type="button" onClick={() => scrollToSection("paris")}>Paris awaits</button></div></nav>
      <aside className="sound-control" aria-label="Music controls"><button onClick={playing ? stopMusic : startMusic} aria-label={playing ? "Mute music" : "Play music"}><span className={playing ? "sound-wave active" : "sound-wave"}>♪</span>{playing ? "Music on" : "Play music"}</button>{playing && <label><span className="sr-only">Music volume</span><input type="range" min="0" max="0.55" step="0.01" value={volume} onChange={e => setVolume(Number(e.target.value))}/></label>}</aside>
      <section className="hero" id="home">
        <div className="sun" />
        <div className="hero-copy"><p className="eyebrow">UNE PETITE LETTRE DE NOUS TOUS</p><h1>Au revoir,<br/><em>Krystyna!</em></h1><p className="intro">Some people leave a team. You leave behind a thousand little reasons to smile.</p><button className="primary" onClick={() => setOpened(true)}>Open your letter <span>→</span></button></div>
        <div className="paris-scene" aria-label="Illustration of Paris"><div className="postcard-card"><span>PARIS</span><small>48.8566° N, 2.3522° E</small></div><div className="moon">☾</div><div className="tower"/><div className="skyline"><i/><i/><i/><i/><i/></div><div className="flight-path">· · · · · · ✈</div></div>
        <p className="scroll-note">SCROLL FOR A LITTLE PARIS MAGIC ↓</p>
      </section>
      {opened && <div className="letter-overlay" role="dialog" aria-modal="true" aria-label="Farewell letter"><button className="close" onClick={() => setOpened(false)} aria-label="Close letter">×</button><article className="letter"><div className="letter-date">OTTAWA · AUGUST 2026</div><h2>Chère Krystyna,</h2><p>You brought a rare kind of light to our team—the kind that makes people feel welcome, makes hard days easier, and turns colleagues into friends.</p><p>We’re so excited for the life waiting for you in France. Go wander down tiny streets, find your favourite café, say yes to new adventures, and know that a whole group of people back here will always be cheering you on.</p><p className="letter-sign">With so much love,<br/><strong>Your team</strong> ♥</p><div className="wax">K</div></article></div>}
      <section className="messages" id="memories"><div className="section-heading"><p className="eyebrow">POSTCARDS FROM HOME</p><h2>A few things we hope<br/>you’ll take with you</h2><p>Little notes for the big adventure ahead.</p></div><div className="cards">{notes.map((note, i) => <article className={`note note-${i + 1}`} key={note.name}><div className="stamp">{note.stamp}</div><div className="postmark">◯<br/><span>17.08.26</span></div><span className="quote">“</span><p>{note.text}</p><footer><b>{note.name}</b><small>{note.role}</small></footer></article>)}</div></section>
      <section className="paris" id="paris"><div className="paris-inner"><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>Paris is waiting<br/>for you.</h2><p className="paris-copy">For the morning cafés. The golden evenings. The people you haven’t met yet. The stories you’ll tell us when we see you again.</p><div className="wish-row"><span>joy</span><i>✦</i><span>courage</span><i>✦</i><span>adventure</span><i>✦</i><span>home</span></div><button className="final-button" onClick={() => setFinale(true)}>Send Krystyna some love ♥</button></div><div className="arc"/></section>
      <footer className="footer"><div><span>Ottawa</span><b>→</b><span>Paris</span></div><p>Not goodbye. Just <em>à bientôt.</em></p><small>MADE WITH LOVE BY YOUR TEAM · 2026</small></footer>
      {finale && <div className="finale" aria-live="polite"><div className="confetti">✦ ♥ ✧ ♥ ✦</div><div className="heart">♥</div><h2>Bon voyage, Krystyna!</h2><p>Paris is lucky to have you.</p></div>}
    </main>
  );
}
