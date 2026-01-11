
import "./globals.css";
import Header from "@/components/Header";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
      >
        <Header />
        <main className="md:ml-16 pb-16 md:pb-0">
          {children}
        </main>
      </body>
    </html>
  );
}
