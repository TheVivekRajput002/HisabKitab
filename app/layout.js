import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Header from "@/components/Header";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import CompanyProvider from "@/components/CompanyProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClerkProvider>
          <CompanyProvider>
            <Header />
            <main className="md:ml-16 pb-16 md:pb-0">
              {children}
            </main>
            <KeyboardShortcutsHelp />
          </CompanyProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
