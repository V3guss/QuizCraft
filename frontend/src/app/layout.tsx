import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "QuizCraft AI - เปลี่ยนเอกสารเรียนให้เป็นชีทสรุปพร้อมสอบ",
  description:
    "อัปโหลดเอกสารการเรียน ให้ AI ช่วยสรุปเนื้อหาสำคัญ สร้าง Flashcard และแบบทดสอบ เพื่อเตรียมสอบได้ง่ายขึ้น",
};

// Applies the saved (or system) theme before first paint to avoid a light/dark flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-thai">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--c-surface)",
              color: "var(--c-text)",
              borderRadius: "14px",
              border: "1px solid var(--c-border)",
              padding: "12px 16px",
              fontSize: "14px",
              boxShadow: "0 10px 30px -10px var(--c-shadow)",
            },
            success: { iconTheme: { primary: "#16A34A", secondary: "#FFFFFF" } },
            error: { iconTheme: { primary: "#DC2626", secondary: "#FFFFFF" } },
          }}
        />
      </body>
    </html>
  );
}
