import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokéDraft Studio | Pokémon TCG Shorts Drafter & Prize Wheel",
  description:
    "Stateless viral Pokémon TCG Shorts randomizer & tabletop prize wheel powered by PokéAPI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 select-none font-sans">
        {children}
      </body>
    </html>
  );
}
