
import "./globals.css";
import Header from "@/components/Header";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main className="md:ml-16 pb-16 md:pb-0">
            {children}
          </main>
          <KeyboardShortcutsHelp />
        </AuthProvider>
      </body>
    </html>
  );
}
