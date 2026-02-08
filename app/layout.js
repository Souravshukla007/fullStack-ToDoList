import "./globals.css";

export const metadata = {
  title: "Todo App",
  description: "Next.js + Tailwind + Prisma + Neon Todo App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
