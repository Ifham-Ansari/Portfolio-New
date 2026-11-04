"use client";

import { useRef, type CSSProperties, type HTMLAttributes } from "react";
import { useInView } from "framer-motion";

type Props = HTMLAttributes<HTMLDivElement> & { delay?: number };

export default function Reveal({ children, delay = 0, style, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: .12 });
  return <div {...props} ref={ref} data-reveal data-visible={visible}
    style={{ ...style, "--reveal-delay": `${delay}s` } as CSSProperties}>
    {children}
  </div>;
}
