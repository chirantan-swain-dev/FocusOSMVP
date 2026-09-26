import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FocusOS — Personal Operating System",
  description: "An ADHD-friendly workspace for tasks, habits, goals and focused work."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}