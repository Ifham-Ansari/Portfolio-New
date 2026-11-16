"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, BarChart3, BrainCircuit, Check, Code2, Database, FileText, MessageSquare, Play, Search, Send } from "lucide-react";
import Reveal from "./Reveal";
import { useMotionPreference as useReducedMotion } from "./useMotionPreference";
import styles from "./ArchitectureDemo.module.css";

const STEP_NAMES = ["RECEIVING USER QUERY", "EMBEDDING QUERY", "SEARCHING VECTOR INDEX", "RETRIEVING CONTEXT", "PASSING CONTEXT TO LLM", "LLM GENERATING RESPONSE", "DELIVERING OUTPUT"];
const STEP_TAGS = ["STEP 01 / USER QUERY", "STEP 02 / EMBEDDING", "STEP 03 / VECTOR SEARCH", "STEP 04 / RETRIEVED CONTEXT", "STEP 05 / PROMPT ASSEMBLY", "STEP 06 / LLM RESPONSE", "STEP 07 / OUTPUT"];
const STEP_MS = 1650;

const STEPS = [
  { title: "User Query", text: "The user asks a question in plain, natural language — no keywords or legal jargon needed.", code: "input: raw text", Icon: MessageSquare },
  { title: "Embedding", text: "An embedding model converts the query into a high-dimensional vector that captures its meaning.", code: "text-embedding → 1,536 dims", Icon: BarChart3 },
  { title: "Vector Search", text: "The vector is matched against the indexed knowledge base by cosine similarity — searching by meaning.", code: "FAISS / ChromaDB · top-k = 3", Icon: Database },
  { title: "Retrieved Context", text: "The most relevant statute and judgment passages are pulled out, ranked by similarity score.", code: "3 passages · scores 0.86–0.94", Icon: FileText },
  { title: "Context → LLM", text: "Retrieved passages + the question are assembled into one grounded prompt and sent to the LLM.", code: "system + context + query", Icon: Code2 },
  { title: "LLM Response", text: "The model reasons only over the supplied context and streams an answer back, token by token.", code: "grounded generation · streaming", Icon: BrainCircuit },
  { title: "Output", text: "The user receives a clear answer with source citations — traceable back to the exact law.", code: "answer + citations", Icon: Send },
];

type Doc = { ref: string; score: number; text: string };
type Example = { query: string; docs: Doc[]; answer: string; cites: string[] };

const EXAMPLES: Record<string, Example> = {
  theft: {
    query: "What is the punishment for theft under the Pakistan Penal Code?",
    docs: [
      { ref: "PPC §379 — Punishment for theft", score: 94, text: "Whoever commits theft shall be punished with imprisonment of either description for a term which may extend to three years, or with fine, or with both." },
      { ref: "PPC §378 — Theft defined", score: 89, text: "Whoever, intending to take dishonestly any moveable property out of the possession of any person without that person's consent, moves that property in order to such taking, is said to commit theft." },
      { ref: "PPC §380 — Theft in a dwelling house", score: 86, text: "Whoever commits theft in any building, tent or vessel used as a human dwelling shall be punished with imprisonment which may extend to seven years, and shall also be liable to fine." },
    ],
    answer: "Under Section 379 of the Pakistan Penal Code, theft is punishable with imprisonment for up to three years, a fine, or both. Section 378 defines theft as dishonestly taking movable property out of another person's possession without their consent. If the theft happens inside a dwelling house, Section 380 raises the punishment to up to seven years' imprisonment plus a fine.",
    cites: ["PPC §378", "PPC §379", "PPC §380"],
  },
  bail: {
    query: "How does bail work for a bailable offence under the CrPC?",
    docs: [
      { ref: "CrPC §496 — Bail in bailable offences", score: 93, text: "When any person accused of a bailable offence is arrested or appears before the Court, he shall be released on bail — in such offences, bail is a matter of right, subject to furnishing a bond." },
      { ref: "CrPC §497 — Non-bailable offences", score: 88, text: "In a non-bailable offence, release on bail is at the discretion of the Court, which weighs the gravity of the accusation, the evidence, and the risk of the accused absconding." },
      { ref: "CrPC §498 — Pre-arrest bail", score: 84, text: "The High Court or Court of Session may, in the event of arrest being anticipated, direct that the person be released on bail — protective bail before arrest." },
    ],
    answer: "For a bailable offence, bail is a matter of right under Section 496 CrPC — the police or the court must release the accused once a bond (with or without sureties) is furnished. Non-bailable offences fall under Section 497, where bail is discretionary and depends on the seriousness of the charge and the strength of the evidence. If arrest is feared before it happens, pre-arrest bail can be sought under Section 498.",
    cites: ["CrPC §496", "CrPC §497", "CrPC §498"],
  },
  fir: {
    query: "How can I register an FIR at a police station in Pakistan?",
    docs: [
      { ref: "CrPC §154 — Information in cognizable cases", score: 95, text: "Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing, read over to the informant, and signed by them; a copy is given free of cost." },
      { ref: "CrPC §155 — Non-cognizable offences", score: 87, text: "Information about a non-cognizable offence is entered in the station diary and the informant is referred to a Magistrate; police cannot investigate such cases without a Magistrate's order." },
      { ref: "CrPC §22-A / 22-B — Justice of Peace", score: 82, text: "If the police refuse to register an FIR, the complainant may approach the Justice of Peace, who can direct the police to register the case and investigate." },
    ],
    answer: "An FIR is registered under Section 154 CrPC. Go to the police station in whose jurisdiction the offence occurred: the SHO must record your statement in writing, read it back to you, take your signature, enter it in the FIR book, and give you a free copy. For a non-cognizable offence, Section 155 applies and the matter goes through a Magistrate. If the station refuses to register your FIR, you can apply to the Justice of Peace under Sections 22-A/22-B CrPC to have registration ordered.",
    cites: ["CrPC §154", "CrPC §155", "CrPC §22-A/22-B"],
  },
};

function genericData(q: string): Example {
  return {
    query: q,
    docs: [
      { ref: "Knowledge base — chunk #1,247", score: 91, text: "The most semantically similar passage in the indexed collection for this question, retrieved from the vector store after chunking and embedding 6,000+ statutes and 100,000+ judgments." },
      { ref: "Knowledge base — chunk #842", score: 87, text: "A supporting passage whose embedding sits close to the query vector, adding the definitions and conditions the answer depends on." },
      { ref: "Knowledge base — chunk #2,019", score: 83, text: "A third ranked passage kept as context so the LLM can cross-check and cite, instead of answering from memory." },
    ],
    answer: "This answer is generated from the passages retrieved above — not from the model's memory. In the production EZ Qanoon system, the same flow grounds every reply in the actual statute or judgment text, and the sources are attached so the user can verify each claim. Try one of the sample questions above to see a full legal answer with real citations.",
    cites: ["Chunk #1,247", "Chunk #842", "Chunk #2,019"],
  };
}

function vecBars(seed: number) {
  return Array.from({ length: 28 }, (_, i) => {
    const h = 14 + Math.round(Math.abs(Math.sin(seed * 3.1 + i * 1.37)) * 60);
    return <i key={i} style={{ height: `${h}px`, animationDelay: `${i * 22}ms` }} />;
  });
}
function vecNums(seed: number) {
  const nums = Array.from({ length: 8 }, (_, i) => Math.sin(seed + i * 2.3).toFixed(3));
  return `[${nums.join(", ")}, … ]`;
}

export default function ArchitectureDemo() {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState(EXAMPLES.theft.query);
  const [currentKey, setCurrentKey] = useState("theft");
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [loopOn, setLoopOn] = useState(false);
  const [data, setData] = useState<Example>(EXAMPLES.theft);
  const [typed, setTyped] = useState("");
  const [outputState, setOutputState] = useState("NO ANSWER YET");
  const [showLatency, setShowLatency] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loopRef = useRef(false);
  const runRef = useRef<() => void>(() => {});

  const clearTimers = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  // Streaming typing effect while the LLM stage (step 5) is active.
  // Every run resets `typed` to "" before step 0, so the stream always starts empty.
  useEffect(() => {
    if (step !== 5 || reduced) return;
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setTyped(data.answer.slice(0, i));
      if (i >= data.answer.length) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [step, data, reduced]);
  const shownTyped = reduced ? data.answer : typed;

  const currentData = useCallback(() => {
    const q = query.trim();
    if (EXAMPLES[currentKey] && q === EXAMPLES[currentKey].query) return EXAMPLES[currentKey];
    return genericData(q || EXAMPLES.theft.query);
  }, [query, currentKey]);

  const finishRun = useCallback(() => {
    setStep(6);
    setOutputState("ANSWER READY");
    setShowLatency(true);
    setRunning(false);
    if (loopRef.current) timers.current.push(setTimeout(() => runRef.current(), 3200));
  }, []);

  const runPipeline = useCallback(() => {
    clearTimers();
    const d = currentData();
    setData(d);
    setStarted(true);
    setRunning(true);
    setTyped("");
    setOutputState("RUNNING…");
    setShowLatency(false);
    if (reduced) {
      setStep(6);
      setOutputState("ANSWER READY");
      setShowLatency(true);
      setRunning(false);
      if (loopRef.current) timers.current.push(setTimeout(() => runRef.current(), 3200));
      return;
    }
    setStep(0);
    for (let s = 1; s < 7; s++) {
      timers.current.push(setTimeout(() => setStep(s), s * STEP_MS));
    }
    timers.current.push(setTimeout(() => finishRun(), 7 * STEP_MS));
  }, [clearTimers, currentData, finishRun, reduced]);
  useEffect(() => { runRef.current = runPipeline; }, [runPipeline]);

  const runExample = (key: string) => {
    setCurrentKey(key);
    setQuery(EXAMPLES[key].query);
    // Run with the example's data even before the state update lands.
    clearTimers();
    const d = EXAMPLES[key];
    setData(d);
    setStarted(true);
    setRunning(true);
    setTyped("");
    setOutputState("RUNNING…");
    setShowLatency(false);
    if (reduced) { setStep(6); setOutputState("ANSWER READY"); setShowLatency(true); setRunning(false); return; }
    setStep(0);
    for (let s = 1; s < 7; s++) timers.current.push(setTimeout(() => setStep(s), s * STEP_MS));
    timers.current.push(setTimeout(() => finishRun(), 7 * STEP_MS));
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    const match = Object.keys(EXAMPLES).find(k => EXAMPLES[k].query === value.trim()) ?? null;
    if (match) setCurrentKey(match);
  };

  const statusText = step < 0 ? "READY — PRESS RUN PIPELINE" : running || step < 6 ? `${STEP_NAMES[step]}…` : "COMPLETE — GROUNDED ANSWER DELIVERED";

  const detail: ReactNode = (() => {
    if (step < 0) return <>
      <p className={styles.lead}>Press <b>Run pipeline</b> and this panel shows what is happening inside each stage — the vector, the search scores, the retrieved passages and the exact prompt sent to the LLM.</p>
      <p style={{ marginTop: 12, color: "#8b91ad" }}>The same flow powers EZ Qanoon in production: chunking → embeddings → semantic search → grounded generation.</p>
    </>;
    if (step === 0) return <>
      <p className={styles.lead}>“{data.query}”</p>
      <p style={{ marginTop: 12 }}>The raw question enters the API exactly as typed. No SQL, no keyword matching — everything downstream works on meaning.</p>
    </>;
    if (step === 1) return <>
      <p className={styles.lead}>The query is converted into a 1,536-dimensional vector.</p>
      <div className={styles.vec} aria-hidden="true">{vecBars(data.query.length)}</div>
      <p className={styles.mono}>{vecNums(data.query.length)}</p>
      <p style={{ marginTop: 10 }}>Each number encodes a slice of meaning, so similar questions land close together in vector space.</p>
    </>;
    if (step === 2) return <>
      <p className={styles.lead}>Cosine similarity ranks every indexed chunk against the query vector.</p>
      {data.docs.map((d, i) => <div key={d.ref} className={styles.doc}><div className={styles.docTop}><span>Scanning… {d.ref.split(" — ")[0]}</span><b>{(d.score / 100).toFixed(2)}</b></div><div className={styles.score}><i style={{ width: `${d.score}%`, animationDelay: `${i * 160}ms` }} /></div></div>)}
      <p style={{ marginTop: 12 }}>6,000+ statutes and 100,000+ judgments were chunked and embedded offline — search runs over those vectors in milliseconds.</p>
    </>;
    if (step === 3) return <>
      <p className={styles.lead}>Top-3 passages retrieved — this is the only evidence the LLM will be allowed to use:</p>
      {data.docs.map((d, i) => <div key={d.ref} className={styles.doc} style={{ animationDelay: `${i * 120}ms` }}><div className={styles.docTop}><span>{d.ref}</span><b>{(d.score / 100).toFixed(2)}</b></div><div className={styles.score}><i style={{ width: `${d.score}%` }} /></div><p>{d.text}</p></div>)}
    </>;
    if (step === 4) return <>
      <p className={styles.lead}>One grounded prompt is assembled and sent to the LLM:</p>
      <div className={styles.prompt} style={{ marginTop: 12 }}><b>SYSTEM:</b> Answer only from the context below. Cite the section for every claim.{"\n"}<b>CONTEXT:</b> <span className={styles.ctx}>{data.docs.map(d => `${d.ref} — ${d.text}`).join(" ")}</span>{"\n"}<b>QUESTION:</b> {data.query}</div>
    </>;
    if (step === 5) return <>
      <p className={styles.lead}>The LLM reasons over the supplied context and streams the answer:</p>
      <p style={{ marginTop: 12 }}>{shownTyped}<span className={styles.cursor} /></p>
    </>;
    return <>
      <p className={styles.lead}>Done — the final answer, with citations, is shown in the output panel.</p>
      <p style={{ marginTop: 12 }}>Every claim can be traced back to a retrieved passage, which is what makes RAG trustworthy for legal questions.</p>
    </>;
  })();

  return <section id="architecture" className={`${styles.section} ${styles.archSection}`} aria-labelledby="architecture-heading">
    <div className={styles.sectionTop}><span className={styles.kicker}>04 / ARCHITECTURE DEMO</span><span className={styles.sectionMeta}>RAG PIPELINE — LIVE FLOW</span></div>
    <Reveal className={styles.head}>
      <h2 id="architecture-heading">From a question to a<br /><em>grounded answer.</em></h2>
      <p data-anim="rise">This is the exact architecture behind EZ Qanoon — my legal RAG system over 6,000+ statutes and 100,000+ judgments. Type a question, run it, and watch it travel through every stage.</p>
    </Reveal>
    <Reveal className={styles.demo}>
      <div className={styles.controls} data-anim="stagger">
        <label className={styles.queryWrap}>
          <Search size={18} aria-hidden="true" />
          <input type="text" value={query} onChange={e => onQueryChange(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); runPipeline(); } }} aria-label="Your question" maxLength={160} />
        </label>
        <button type="button" className={styles.run} onClick={runPipeline} disabled={running}>Run pipeline <ArrowRight size={16} aria-hidden="true" /></button>
        <button type="button" className={styles.loopBtn} aria-pressed={loopOn} onClick={() => { const next = !loopOn; loopRef.current = next; setLoopOn(next); if (next && !running) runPipeline(); }}><span className={styles.loopDot} /> Auto loop</button>
      </div>
      <div className={styles.examples} role="group" aria-label="Example questions" data-anim="stagger">
        <span>TRY:</span>
        <button type="button" data-arch-example="theft" className={currentKey === "theft" && query.trim() === EXAMPLES.theft.query ? styles.selected : ""} onClick={() => runExample("theft")}>Punishment for theft — PPC</button>
        <button type="button" data-arch-example="bail" className={currentKey === "bail" && query.trim() === EXAMPLES.bail.query ? styles.selected : ""} onClick={() => runExample("bail")}>How bail works — CrPC</button>
        <button type="button" data-arch-example="fir" className={currentKey === "fir" && query.trim() === EXAMPLES.fir.query ? styles.selected : ""} onClick={() => runExample("fir")}>How to register an FIR</button>
      </div>
      <div className={styles.status} aria-live="polite" data-anim="rise">
        <span>STATUS&nbsp; <strong>{statusText}</strong></span>
        <span className={styles.meter} aria-hidden="true"><span style={{ width: `${step < 0 ? 0 : ((step + 1) / 7) * 100}%` }} /></span>
        <span>STEP {step < 0 ? 0 : step + 1} / 7</span>
      </div>
      {!started && <div className={styles.waiting} data-anim="zoom">
        <span className={styles.waitingIcon}><Play size={20} aria-hidden="true" /></span>
        <p className={styles.waitingTitle}>PIPELINE IDLE — NO FLOW YET</p>
        <p>Press <b>Run pipeline</b> — or tap one of the three questions above — and the flow diagram will build itself here, one stage at a time, in flow order.</p>
      </div>}
      <ol className={`${styles.flow} ${started ? styles.on : ""}`}>
        {STEPS.map((s, i) => {
          const nodeClass = [styles.node, i <= step ? styles.revealed : "", i === step && running ? styles.active : "", i < step || (i === 6 && !running && step === 6) ? styles.done : "", i === step - 1 ? styles.flowing : ""].join(" ");
          return <li key={s.title} className={nodeClass}>
            {i < 6 && <span className={styles.packet} aria-hidden="true"><i /></span>}
            <div className={styles.nodeTop}><span className={styles.stepLabel}>STEP 0{i + 1}</span><span className={styles.check}><Check size={11} strokeWidth={3.4} /></span></div>
            <div className={styles.icon}><s.Icon size={20} strokeWidth={1.7} /></div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <code>{s.code}</code>
          </li>;
        })}
      </ol>
      <div className={`${styles.panels} ${started ? styles.on : ""} ${step >= 6 ? styles.showOutput : ""}`}>
        <div className={styles.panel}>
          <div className={styles.panelHead}><h3>INSIDE THE PIPELINE</h3><span>{step < 0 ? "WAITING TO RUN" : STEP_TAGS[step]}</span></div>
          <div className={styles.detailBody}>{detail}</div>
        </div>
        <div className={styles.panel} id="archOutputPanel">
          <div className={styles.panelHead}><h3>FINAL OUTPUT</h3><span>{outputState}</span></div>
          <div className={styles.outputBody}>
            {step >= 6 ? <>
              <p>{data.answer}</p>
              <div className={styles.cite}>{data.cites.map(c => <span key={c}>SOURCE · {c}</span>)}</div>
            </> : step === 5 ? <>
              <p>{shownTyped}<span className={styles.cursor} /></p>
            </> : <p className={styles.placeholder}>The grounded answer will appear here at the end of the pipeline — written by the LLM from the retrieved context, with its sources attached.</p>}
          </div>
          {showLatency && <div className={styles.latency}>
            <span>EMBED <b>~40ms</b></span><span>SEARCH <b>~65ms</b></span><span>RETRIEVE <b>3 DOCS</b></span><span>GENERATE <b>~1.2s</b></span>
          </div>}
        </div>
      </div>
    </Reveal>
  </section>;
}
