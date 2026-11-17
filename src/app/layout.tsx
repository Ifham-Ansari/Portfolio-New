import type { Metadata } from "next";
import "./theme.css"; // the site colours — edit this one file to re-theme everything
import "./globals.css";
import { introPrepaintScript } from "@/components/introConfig";

export const metadata: Metadata = {
  title: "Ifham Ansari | AI Engineer | Agentic AI, RAG & AI Automation",
  description: "AI Engineer building agentic AI, LLM applications, RAG systems, and automation products.",
  openGraph: { title: "Ifham Ansari | AI Engineer", description: "Agentic AI, RAG systems, and AI automation." },
  twitter: { card: "summary", title: "Ifham Ansari | AI Engineer", description: "Agentic AI, RAG systems, and AI automation." },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // suppressHydrationWarning: the pre-paint script adds data-intro to <html> before React hydrates.
  return <html lang="en" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: introPrepaintScript }} /></head>
    <body>{children}</body>
  </html>;
}
