import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Header from "@/components/Header";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import CompanyProvider from "@/components/CompanyProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script type="text/javascript">
          (function(c,l,a,r,i,t,y){
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "wtj0aj88xv");
        </script>
      </head>
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
