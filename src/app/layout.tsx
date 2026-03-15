import type { Metadata } from "next";
import { Roboto, Poppins, Raleway } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollTop from "@/components/ScrollTop";
import CartOffcanvas from "@/components/CartOffcanvas";
import BodyClassManager from "@/components/BodyClassManager";
import Preloader from "@/components/Preloader";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--default-font",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--heading-font",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--nav-font",
});

export const metadata: Metadata = {
  title: "HallMark Enterprises",
  description: "A Wholesale Distributor & Food Processing Co.",
  icons: {
    icon: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566812/hallmark/favicon.png",
    apple: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566812/hallmark/favicon.png",
  },
};

import { CartProvider } from "@/context/CartContext";
import { EnquiryProvider } from "@/context/EnquiryContext";
import EnquiryOffcanvas from "@/components/EnquiryOffcanvas";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
        <link href="/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet" />
        <link href="/assets/vendor/aos/aos.css" rel="stylesheet" />
        <link href="/assets/vendor/glightbox/css/glightbox.min.css" rel="stylesheet" />
        <link href="/assets/vendor/swiper/swiper-bundle.min.css" rel="stylesheet" />
        <link href="/assets/css/main.css" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet" />
      </head>
      <body className={`${roboto.variable} ${poppins.variable} ${raleway.variable}`} suppressHydrationWarning>
        <CartProvider>
          <EnquiryProvider>
            <Preloader />
            <BodyClassManager />
            <Header />
            <main className="main">
              {children}
            </main>
            <Footer />
            <ScrollTop />
            <CartOffcanvas />
            <EnquiryOffcanvas />
            <SpeedInsights />
          </EnquiryProvider>
        </CartProvider>

        {/* Vendor JS Files using Next.js Script component */}
        <Script src="/assets/vendor/bootstrap/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/aos/aos.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/glightbox/js/glightbox.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/swiper/swiper-bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/purecounter/purecounter_vanilla.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/imagesloaded/imagesloaded.pkgd.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/isotope-layout/isotope.pkgd.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
