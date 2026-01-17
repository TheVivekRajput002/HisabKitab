
import "./globals.css";
import Header from "@/components/Header";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="md:ml-16 pb-16 md:pb-0">
          {children}
        </main>
        <KeyboardShortcutsHelp />
      </body>
    </html>
  );
}
