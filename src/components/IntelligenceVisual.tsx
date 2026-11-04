"use client";

import { useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import { useMotionPreference as useReducedMotion } from "./useMotionPreference";
import styles from "./IntelligenceVisual.module.css";

const nodes = Array.from({ length: 68 }, (_, i) => {
  const y = 1 - (i / 67) * 2;
  const radius = Math.sqrt(1 - y * y);
  const theta = i * Math.PI * (3 - Math.sqrt(5));
  return { x: Number((250 + Math.cos(theta) * radius * 170).toFixed(3)), y: Number((250 + y * 170).toFixed(3)), z: Number((Math.sin(theta) * radius).toFixed(3)) };
});
const edges = nodes.flatMap((node, i) => nodes.slice(i + 1).map((other, j) => ({ node, other, key: `${i}-${i + j + 1}` }))
  .filter(({ node, other }) => Math.hypot(node.x - other.x, node.y - other.y) < 57));

export default function IntelligenceVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { margin: "50px" });
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const drift = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(y, { stiffness: 65, damping: 20 });
  const rotateY = useSpring(x, { stiffness: 65, damping: 20 });

  return <div ref={ref} className={styles.stage} data-visible={visible} aria-hidden="true"
    onPointerMove={(event) => {
      if (reduced || event.pointerType !== "mouse") return;
      const bounds = event.currentTarget.getBoundingClientRect();
      x.set(((event.clientX - bounds.left) / bounds.width - .5) * 14);
      y.set(-((event.clientY - bounds.top) / bounds.height - .5) * 14);
    }} onPointerLeave={() => { x.set(0); y.set(0); }}>
    <div className={styles.coordinates}><span>FIG. 01</span><span>INTELLIGENCE, CONNECTED</span></div>
    <motion.div className={styles.geometry} style={reduced ? undefined : { rotateX, rotateY, y: drift }}>
      <div className={styles.halo} />
      <svg viewBox="0 0 500 500" className={styles.network} fill="none">
        <defs>
          <radialGradient id="sphere-light"><stop stopColor="#a27aff" stopOpacity=".4" /><stop offset=".6" stopColor="#7e5ac9" stopOpacity=".12" /><stop offset="1" stopColor="#b9dfff" stopOpacity="0" /></radialGradient>
          <linearGradient id="orbit-light"><stop stopColor="#c8ceec" /><stop offset="1" stopColor="#7783d8" stopOpacity=".2" /></linearGradient>
        </defs>
        <circle cx="250" cy="250" r="210" fill="url(#sphere-light)" />
        <circle cx="250" cy="250" r="171" stroke="#b6bee5" strokeOpacity=".22" />
        <ellipse cx="250" cy="250" rx="218" ry="58" stroke="url(#orbit-light)" transform="rotate(-27 250 250)" />
        <ellipse cx="250" cy="250" rx="195" ry="75" stroke="#b3b7ef" strokeOpacity=".23" transform="rotate(65 250 250)" />
        <g stroke="#badcff" strokeWidth=".9">
          {edges.map(({ node, other, key }) => <line key={key} x1={node.x} y1={node.y} x2={other.x} y2={other.y} opacity={Number((.18 + (node.z + 1) * .2).toFixed(3))} />)}
        </g>
        {nodes.map((node, i) => <circle key={i} cx={node.x} cy={node.y} r={node.z > .3 ? 2.8 : 1.6} fill={i % 4 ? "#b6bee5" : "#b1acff"} opacity={Number((.25 + (node.z + 1) * .35).toFixed(3))} />)}
        <g className={styles.signal}><circle cx="250" cy="79" r="4" fill="#dde1f3" /><circle cx="250" cy="79" r="9" stroke="#b6bee5" strokeOpacity=".4" /></g>
        <path d="M250 22V48M250 452V478M22 250H48M452 250H478" stroke="#858cb1" strokeOpacity=".5" />
        <circle cx="250" cy="250" r="7" fill="#e5e8f6" /><circle cx="250" cy="250" r="20" stroke="#e5e8f6" strokeOpacity=".4" />
      </svg>
      <div className={styles.tagOne}>RETRIEVE <span>01</span></div>
      <div className={styles.tagTwo}>REASON <span>02</span></div>
      <div className={styles.tagThree}>ACT <span>03</span></div>
    </motion.div>
    <div className={styles.caption}><span className={styles.dot} /> AGENTIC SYSTEMS <span className={styles.line} /> HUMAN-CENTERED OUTCOMES</div>
  </div>;
}
