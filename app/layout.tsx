import "./globals.css";

export const metadata = {
  title: "AI Landing Page Generator - A Best Landing Page Generator",
  description:
    "AI-Powered Landing Page Generator. Create landing page easily with AI",
  openGraph: {
    title: "AI Landing Page Generator - A Best Landing Page Generator",
    description:
      "AI-Powered Landing Page Generator. Create landing page easily with AI",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
	  <head>
	     <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	  </head>
      <body>{children}</body>
    </html>
  );
}
