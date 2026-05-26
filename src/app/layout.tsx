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
import { Analytics } from "@vercel/analytics/next";
import { getSiteSeoSettings } from "@/lib/site-actions";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--default-font",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--heading-font",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--nav-font",
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoSettings();
  const def = seo?.default;
  return {
    title: def?.title || "HallMark Enterprises",
    description: def?.description || "A Wholesale Distributor & Food Processing Co.",
    keywords: def?.keywords,
    openGraph: {
      title: def?.ogTitle || def?.title,
      description: def?.ogDescription || def?.description,
      images: def?.ogImage ? [def.ogImage] : ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png"],
    },
    icons: {
      icon: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566812/hallmark/favicon.png",
      apple: "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566812/hallmark/favicon.png",
    },
  };
}

import { CartProvider } from "@/context/CartContext";
import { EnquiryProvider } from "@/context/EnquiryContext";
import { InvestProvider } from "@/context/InvestContext";
import EnquiryOffcanvas from "@/components/EnquiryOffcanvas";
import InvestOffcanvas from "@/components/InvestOffcanvas";
import DistributorOffcanvas from "@/components/DistributorOffcanvas";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await getSiteSeoSettings();
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
        {/* Dynamic GA4 Tracking */}
        {seo?.googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${seo.googleAnalyticsId}');
              `}
            </Script>
          </>
        )}
        {/* Dynamic Facebook Pixel Tracking */}
        {seo?.facebookPixelId && (
          <Script id="facebook-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${seo.facebookPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        {/* Custom Head Snippet */}
        {seo?.customHeadScript && (
          <style dangerouslySetInnerHTML={{ __html: `</style>${seo.customHeadScript}<style>` }} />
        )}
      </head>
      <body className={`${roboto.variable} ${poppins.variable} ${raleway.variable}`} suppressHydrationWarning>
        <CartProvider>
          <EnquiryProvider>
            <InvestProvider>
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
              <InvestOffcanvas />
              <DistributorOffcanvas />
              <SpeedInsights />
              <Analytics />
            </InvestProvider>
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

        {/* Custom Footer/Body Scripts */}
        {seo?.customBodyScript && (
          <div dangerouslySetInnerHTML={{ __html: seo.customBodyScript }} />
        )}
      </body>
    </html>
  );
}
