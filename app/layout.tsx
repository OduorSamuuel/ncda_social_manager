import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css'; 
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "NCDA Scocial media account manager",
  description: "Manage your social media account with ease ",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
         <MantineProvider>
        <NextTopLoader  height={2} showSpinner={false}  crawlSpeed={200}/>
        <Notifications position="top-right" zIndex={1000} />
          {children}
        </MantineProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
