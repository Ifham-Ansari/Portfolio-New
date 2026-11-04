import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ifham Ansari | AI Engineer | Agentic AI, RAG & AI Automation",
  description: "AI Engineer building agentic AI, LLM applications, RAG systems, and automation products.",
  openGraph: { title: "Ifham Ansari | AI Engineer", description: "Agentic AI, RAG systems, and AI automation." },
  twitter: { card: "summary", title: "Ifham Ansari | AI Engineer", description: "Agentic AI, RAG systems, and AI automation." },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}
