import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { CustomCursor } from "@/components/CustomCursor";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Campus Olx",
  description: "Premium campus marketplace front end",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} bg-graphite-950 text-white antialiased md:cursor-none`}>
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}