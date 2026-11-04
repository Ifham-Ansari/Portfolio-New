"use client";

import { motion, useScroll } from "framer-motion";
import styles from "./Portfolio.module.css";

export default function ScrollExperience() {
  const { scrollYProgress } = useScroll();
  return <motion.div className={styles.scrollProgress} style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}
