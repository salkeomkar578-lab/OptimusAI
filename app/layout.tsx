import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "OptimusAI — Continuous Adaptive AI Study & Exam Preparation",
  description: "Transform unstructured syllabi and past exam papers into an actionable, dynamically updating study plan that adapts continuously to your progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <Suspense fallback={<header className="h-16 bg-[#090d16] border-b border-slate-800" />}>
          <Navbar />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  );
}
