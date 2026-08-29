import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "Emotiv People Registration",
  description: "Administration & Registration Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}