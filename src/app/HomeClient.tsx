"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useInvest } from "@/context/InvestContext";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import { ProductCardShimmer, ShimmerBox } from "@/components/Shimmer";
import AddressTabs from "@/components/AddressTabs";

interface SiteProduct {
  id: string;
  title: string;
  category: string;
  brand: string;
  desc: string;
  image?: string;
  price?: string;
}

interface SiteBrand {
  id: string;
  name: string;
  image?: string;
  summary?: string;
}

interface SiteTestimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
}

interface NavCategory {
  id: string;
  name: string;
}

interface HeroBanner {
  id: string;
  image: string;
  order: number;
}

interface AboutUsData {
  title: string;
  description1: string;
  description2: string;
  description3: string;
  points: string[];
  image?: string;
  cards?: { icon: string; title: string; desc: string }[];
}

interface StatItem {
  icon: string;
  value: string;
  label: string;
}

interface StatsData {
  title: string;
  description: string;
  image: string;
  stats: StatItem[];
}

interface InvestorsData {
  badgeText: string;
  titleLight: string;
  titleBold: string;
  description: string;
  cards: { icon: string; title: string; description: string }[];
  bottomText: string;
}

interface WebsiteContent {
  heroBanners: HeroBanner[];
  aboutUs: AboutUsData;
  stats: StatsData;
  investors?: InvestorsData;
  counts?: { products: number; categories: number };
}

export default function HomeClient({ initialData }: { initialData?: any }) {
  const { addToCart } = useCart();
  const { setIsInvestOpen } = useInvest();
  const [contactState, setContactState] = useState({ loading: false, success: false, error: "" });
  const [b2bUser, setB2bUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch("/api/b2b/me")
      .then((r) => r.json())
      .then((res) => { if (res.authenticated) setB2bUser(res.user); })
      .catch(() => { })
      .finally(() => setMounted(true));
  }, []);

  useEffect(() => {
    // Manually trigger Swiper initialization after component mounts
    const initSwiper = () => {
      if (typeof window !== "undefined" && (window as any).Swiper) {
        document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
          if (!swiperElement.classList.contains("swiper-initialized")) {
            const configEl = swiperElement.querySelector(".swiper-config");
            if (configEl) {
              try {
                let config = JSON.parse(configEl.innerHTML.trim());
                if (config.navigation) {
                  const section = swiperElement.closest('section');
                  if (section) {
                    config.navigation.nextEl = section.querySelector(config.navigation.nextEl);
                    config.navigation.prevEl = section.querySelector(config.navigation.prevEl);
                  }
                }
                new (window as any).Swiper(swiperElement, config);
              } catch (e) {
                console.error("Failed to parse swiper config", e);
              }
            }
          }
        });
      }
    };
    initSwiper();
    const timer = setTimeout(initSwiper, 500);
    return () => clearTimeout(timer);
  }, []);

  const [currentFeature, setCurrentFeature] = useState(0);
  const [currentHero, setCurrentHero] = useState(0);

  const [products, setProducts] = useState<SiteProduct[]>(initialData?.products ?? []);
  const [productsLoading, setProductsLoading] = useState(initialData?.products ? false : true);

  const [brands, setBrands] = useState<SiteBrand[]>(initialData?.brands ?? []);
  const [brandsLoading, setBrandsLoading] = useState(initialData?.brands ? false : true);

  const [testimonials, setTestimonials] = useState<SiteTestimonial[]>(initialData?.testimonials ?? []);
  const [testimonialsLoading, setTestimonialsLoading] = useState(!initialData?.testimonials);

  const [categories, setCategories] = useState<NavCategory[]>(initialData?.categories ?? []);
  const [categoriesLoading, setCategoriesLoading] = useState(initialData?.categories ? false : true);

  const [websiteContent, setWebsiteContent] = useState<WebsiteContent | null>(initialData?.websiteContent ?? null);
  const [websiteLoading, setWebsiteLoading] = useState(initialData?.websiteContent ? false : true);

  const featureImages = ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566403/hallmark/assets/img/value.png", "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566390/hallmark/assets/img/satisfaction.png", "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566365/hallmark/assets/img/happiness.png"];

  useEffect(() => {
    // Only fetch if initialData is missing (fallback for direct client navigation)
    if (!initialData?.products) {
      setProductsLoading(true);
      fetch("/api/site/products")
        .then((r) => r.json())
        .then((data) => setProducts(data.products || []))
        .finally(() => setProductsLoading(false));
    }

    if (!initialData?.brands) {
      setBrandsLoading(true);
      fetch("/api/site/brands")
        .then((r) => r.json())
        .then((data) => setBrands(data.brands || []))
        .finally(() => setBrandsLoading(false));
    }

    if (!initialData?.testimonials) {
      setTestimonialsLoading(true);
      fetch("/api/site/testimonials")
        .then((r) => r.json())
        .then((data) => setTestimonials(data.testimonials || []))
        .finally(() => setTestimonialsLoading(false));
    }

    if (!initialData?.categories) {
      setCategoriesLoading(true);
      fetch("/api/site/categories")
        .then((r) => r.json())
        .then((data) => setCategories(data.categories || []))
        .finally(() => setCategoriesLoading(false));
    }

    if (!initialData?.websiteContent) {
      setWebsiteLoading(true);
      fetch("/api/site/website-content")
        .then((res) => res.json())
        .then((data) => setWebsiteContent(data))
        .catch(() => setWebsiteContent(null))
        .finally(() => setWebsiteLoading(false));
    }
  }, [initialData]);

  useEffect(() => {
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % featureImages.length);
    }, 3000);
    return () => clearInterval(featureInterval);
  }, []);

  // Refresh AOS after all data has loaded so sections below the brands
  // carousel animate correctly (they were invisible because AOS calculated
  // positions before async data shifted the page layout).
  useEffect(() => {
    if (productsLoading || brandsLoading || testimonialsLoading || categoriesLoading || websiteLoading) return;

    const initAOS = () => {
      const aos = (window as any).AOS;
      if (typeof window !== "undefined" && aos) {
        aos.init({
          duration: 600,
          easing: 'ease-in-out',
          once: true,
          mirror: false
        });
        aos.refresh();
        return true;
      }
      return false;
    };

    // Initial delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      if (!initAOS()) {
        const interval = setInterval(() => {
          if (initAOS()) clearInterval(interval);
        }, 200);
        return () => clearInterval(interval);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [productsLoading, brandsLoading, testimonialsLoading, categoriesLoading, websiteLoading]);

  useEffect(() => {
    const banners = websiteContent?.heroBanners;
    if (!banners || banners.length <= 1) return;
    const heroInterval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(heroInterval);
  }, [websiteContent?.heroBanners]);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setContactState({ loading: true, success: false, error: "" });
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/site/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setContactState({ loading: false, success: true, error: "" });
        (e.target as HTMLFormElement).reset();

        // Hide success message after 5 seconds
        setTimeout(() => setContactState(prev => ({ ...prev, success: false })), 5000);
      } else {
        setContactState({ loading: false, success: false, error: result.error || "Failed to send message." });
      }
    } catch (err) {
      setContactState({ loading: false, success: false, error: "Something went wrong. Please try again." });
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section id="hero" className="hero section dark-background">
        {websiteContent?.heroBanners && websiteContent.heroBanners.length > 0 ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
            {websiteContent.heroBanners.map((banner, idx) => (
              <div
                key={banner.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  transition: 'opacity 1.2s ease-in-out',
                  opacity: currentHero === idx ? 1 : 0,
                  zIndex: currentHero === idx ? 2 : 1,
                }}
              >
                <Image
                  src={banner.image}
                  alt={`Banner ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  style={{ objectFit: 'cover' }}
                  sizes="100vw"
                  quality={85}
                />
              </div>
            ))}
          </div>
        ) : (
          <></>
        )}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="row justify-content-center text-center" data-aos="fade-up" data-aos-delay="100">
            <div className="col-xl-6 col-lg-8">
              <h2 className="responsive-h2"><span>Hallmark</span> Enterprises</h2>
              <p className="responsive-p">"All because we understand you better"</p>
            </div>
          </div>
          <div className="row flex-wrap flex-lg-nowrap justify-content-center mt-5 gx-2 gy-3 hero-icon-grid" data-aos="fade-up" data-aos-delay="200">
            {categories.map((c) => (
              <div key={c.id} className="col-4 col-md-4 col-lg" data-aos="fade-up" data-aos-delay="300">
                <div className="icon-box">
                  {c.name === "Home Care" && <i className="bi bi-house-door-fill"></i>}
                  {c.name === "Fabric Care" && <i className="fa fa-shirt"></i>}
                  {c.name === "Cleaning Liquids" && <i className="bi bi-droplet-fill"></i>}
                  {c.name === "Fancy Supplies" && <i className="bi bi-stars"></i>}
                  {c.name === "Food & Beverages" && <i className="bi bi-cup-straw"></i>}
                  {c.name === "Personal Care" && <i className="bi bi-person-hearts"></i>}
                  {c.name === "Ritual Essentials" && <i className="bi bi-sun"></i>}
                  <h3><a href={`/category/${c.id}`}>{c.name}</a></h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about section" style={{ background: 'linear-gradient(to bottom, #fff, #fcfcfc)' }}>
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="row gy-4 align-items-center">
            <div className="col-lg-6 content" data-aos="fade-right" data-aos-delay="200">
              <h3 className="fw-bold mb-4" style={{ fontSize: '2.5rem', color: 'var(--heading-color)' }}>
                {websiteContent?.aboutUs?.title || "Hallmark Enterprises"}
              </h3>
              <p style={{ textAlign: "justify", fontSize: '1.1rem', lineHeight: '1.8' }}>
                {websiteContent?.aboutUs?.description1}
              </p>
              <p style={{ textAlign: "justify", fontSize: '1.05rem', lineHeight: '1.7', opacity: 0.85 }}>
                {websiteContent?.aboutUs?.description2}
              </p>
              {websiteContent?.aboutUs?.points && websiteContent.aboutUs.points.length > 0 && (
                <ul className="mt-3 mb-4" style={{ textAlign: "justify", listStyle: 'none', padding: 0 }}>
                  {websiteContent.aboutUs.points.map((p, i) => (
                    <li key={i} className="mb-2 d-flex align-items-center">
                      <i className="bi bi-check-circle-fill me-2" style={{ color: 'var(--accent-color)' }}></i>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ textAlign: "justify", fontSize: '1.05rem', lineHeight: '1.7', opacity: 0.85 }}>
                {websiteContent?.aboutUs?.description3}
              </p>
            </div>

            <div className="col-lg-6" data-aos="fade-left" data-aos-delay="300">
              <div className="row g-4">
                {(websiteContent?.aboutUs?.cards && websiteContent.aboutUs.cards.length > 0 ? websiteContent.aboutUs.cards : [
                  { icon: "bi-calendar-check-fill", title: "Since 2014", desc: "Committed to delivering high-quality, affordable essentials for over a decade." },
                  { icon: "bi-person-vcard-fill", title: "Expert Leadership", desc: "Led by Mr. Vinod Bhaskaran with 25+ years of retail marketing excellence." },
                  { icon: "bi-globe-central-south-asia", title: "Regional Presence", desc: "Proven track record across India and the Gulf with strong market expertise." },
                  { icon: "bi-shield-fill-check", title: "Dependable Value", desc: "A value-driven approach focused on building long-term consumer partnerships." }
                ]).map((item, idx) => (
                  <div key={idx} className="col-md-6">
                    <div className="p-4 rounded-4 shadow-sm h-100" style={{
                      background: 'white',
                      border: '1px solid rgba(0,0,0,0.05)',
                      transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
                      cursor: 'default'
                    }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-10px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = 'var(--accent-color)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0,0,0,0.075)';
                        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)';
                      }}>
                      <div className="icon-wrapper mb-3 d-inline-flex align-items-center justify-content-center rounded-circle" style={{ background: 'rgba(255, 196, 81, 0.12)', width: '60px', height: '60px' }}>
                        <i className={`bi ${item.icon} fs-3`} style={{ color: 'var(--accent-color)' }}></i>
                      </div>
                      <h4 className="fw-bold mb-2" style={{ fontSize: '1.25rem', color: 'var(--heading-color)' }}>{item.title}</h4>
                      <p className="small mb-0 text-muted" style={{ lineHeight: '1.6' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section id="clients" className="clients section">
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="section-header">
            <h2>Our Brands</h2>
          </div>
          <div className="swiper init-swiper">
            <script type="application/json" className="swiper-config">
              {`
              {
                "loop": true,
                "speed": 600,
                "observer": true,
                "observeParents": true,
                "autoplay": {
                  "delay": 5000
                },
                "slidesPerView": "auto",
                "breakpoints": {
                  "320": {
                    "slidesPerView": 2,
                    "spaceBetween": 40
                  },
                  "480": {
                    "slidesPerView": 3,
                    "spaceBetween": 60
                  },
                  "640": {
                    "slidesPerView": 4,
                    "spaceBetween": 80
                  },
                  "992": {
                    "slidesPerView": 6,
                    "spaceBetween": 80
                  }
                }
              }
              `}
            </script>
            <div className="swiper-wrapper align-items-center">
              {brandsLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="swiper-slide d-flex align-items-center justify-content-center">
                      <ShimmerBox
                        style={{
                          width: "120px",
                          height: "60px",
                          borderRadius: "12px",
                        }}
                      />
                    </div>
                  ))}
                </>
              ) : brands.length > 0 && (
                brands.map((brand) => (
                  <div key={brand.id} className="swiper-slide">
                    {brand.image && (
                      <img src={brand.image} className="img-fluid" alt={brand.name} />
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="swiper-pagination"></div>
          </div>
        </div>
      </section>

      {/* Features Section — Value, Satisfaction, Happiness */}
      <section id="features" className="features section">
        <div className="container">
          <div className="row gy-4 align-items-center">
            <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
              <div className="features-image-container position-relative" style={{ background: 'var(--surface-color)', borderRadius: '20px', overflow: 'hidden' }}>
                {featureImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Feature"
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{
                      objectFit: 'cover',
                      transition: 'opacity 0.8s ease-in-out, transform 1.2s ease-in-out',
                      opacity: currentFeature === idx ? 1 : 0,
                      transform: currentFeature === idx ? 'scale(1.05)' : 'scale(1)',
                      zIndex: currentFeature === idx ? 2 : 1
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="col-lg-6">
              {[
                {
                  icon: "gem",
                  title: "Value",
                  desc: "High quality products, proven performance, and economical pricing come together in our product range. That's why our customers trust us for products that truly offer value for money—without compromising on quality. Effective results, trusted quality, and great value—day after day.",
                  delay: "200"
                },
                {
                  icon: "shield-check",
                  title: "Satisfaction",
                  desc: "Your satisfaction is at the heart of everything we create. From carefully selected ingredients to strict quality checks, every product is designed to deliver consistent performance you can rely on—every time you use it.",
                  delay: "300"
                },
                {
                  icon: "emoji-smile",
                  title: "Happiness",
                  desc: "Across homes, our products have earned the trust of families who value quality. The smiles, repeat purchases, and positive feedback from our customers inspire us every day to deliver products they can rely on with confidence.",
                  delay: "400"
                }
              ].map((feature, idx) => (
                <div key={idx} className={`features-item d-flex ${idx > 0 ? "mt-5" : "pt-4 pt-lg-0"} ps-0 ps-lg-3`} data-aos="fade-up" data-aos-delay={feature.delay}>
                  <i className={`bi bi-${feature.icon} flex-shrink-0`} style={{ fontSize: '48px', color: 'var(--accent-color)', marginRight: '20px', lineHeight: '1' }}></i>
                  <div>
                    <h4 style={{ fontWeight: '700', fontSize: '1.25rem' }}>{feature.title}</h4>
                    <p style={{ color: 'color-mix(in srgb, var(--default-color), transparent 20%)', fontSize: '15px' }}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      {products.length > 0 && (
        <section id="services" className="services section">
          <div className="container section-title" data-aos="fade-up">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Our Products</h2>
                <p>Quality essentials for every home</p>
              </div>
              <div className="swiper-nav-buttons d-flex gap-2">
                <div className="product-swiper-button-prev custom-swiper-nav" style={{ position: 'static', width: '40px', height: '40px', border: '1px solid var(--accent-color)', borderRadius: '50%', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s', zIndex: '10' }}>
                  <i className="bi bi-chevron-left" style={{ fontSize: '1.2rem' }}></i>
                </div>
                <div className="product-swiper-button-next custom-swiper-nav" style={{ position: 'static', width: '40px', height: '40px', border: '1px solid var(--accent-color)', borderRadius: '50%', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s', zIndex: '10' }}>
                  <i className="bi bi-chevron-right" style={{ fontSize: '1.2rem' }}></i>
                </div>
              </div>
            </div>
          </div>
          <div className="container" data-aos="fade-up" data-aos-delay="100">
            <div className="swiper init-swiper">
              <script type="application/json" className="swiper-config">
                {`
              {
                "loop": true,
                "speed": 600,
                "autoplay": {
                  "delay": 3000
                },
                "slidesPerView": 1,
                "spaceBetween": 30,
                "navigation": {
                  "nextEl": ".product-swiper-button-next",
                  "prevEl": ".product-swiper-button-prev"
                },
                "breakpoints": {
                  "320": {
                    "slidesPerView": 2,
                    "spaceBetween": 20
                  },
                  "768": {
                    "slidesPerView": 2,
                    "spaceBetween": 20
                  },
                  "992": {
                    "slidesPerView": 3,
                    "spaceBetween": 30
                  },
                  "1200": {
                    "slidesPerView": 4,
                    "spaceBetween": 30
                  }
                }
              }
              `}
              </script>
              <div className="swiper-wrapper">
                {products.length === 0 && !productsLoading ? (
                  <div className="swiper-slide">
                    <p className="text-center py-4 text-muted">No products at the moment.</p>
                  </div>
                ) : products.length === 0 ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="swiper-slide h-auto p-2">
                        <ProductCardShimmer />
                      </div>
                    ))}
                  </>
                ) : (
                  products.map((product, i) => (
                    <div key={product.id} className="swiper-slide h-auto p-2">
                      <ProductCard product={product} index={i} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Call To Action Section */}
      <section id="call-to-action" className="call-to-action section dark-background">
        <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566361/hallmark/assets/img/cta-bg.jpg" alt="" className="img-fluid" />
        <div className="container">
          <div className="row justify-content-center" data-aos="zoom-in" data-aos-delay="100">
            <div className="col-xl-10">
              <div className="text-center">
                <h3>"All because we understand you better"</h3>
                <p>From home care to food and grocery essentials, Hallmark Enterprises delivers trusted quality and real value to homes across the region. Explore our full range of products and discover the Hallmark difference.</p>
                {mounted && b2bUser && <a className="cta-btn" href="/shop">Shop Online</a>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats section">
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="row gy-4 align-items-center justify-content-between">
            <div className="col-lg-5" style={{ position: 'relative', minHeight: '400px' }}>
              <Image
                src={websiteContent?.stats?.image || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566392/hallmark/assets/img/stats-img.jpg"}
                alt="Stats"
                fill
                style={{ objectFit: 'cover', borderRadius: '15px' }}
                priority={false}
                sizes="(max-width: 992px) 100vw, 40vw"
              />
            </div>
            <div className="col-lg-6">
              <h3 className="fw-bold fs-2 mb-3">{websiteContent?.stats?.title || "Trusted by homes across India & the Gulf"}</h3>
              <p>
                {websiteContent?.stats?.description || "Since 2014, Hallmark Enterprises has been delivering high-quality, affordable essentials with a commitment to value, satisfaction, and happiness—every single day."}
              </p>
              <div className="row gy-4">
                {(websiteContent?.stats?.stats || [
                  { icon: "emoji-smile", value: "10", label: "Years of Excellence" },
                  { icon: "box-seam", value: "26", label: "Products & Growing" },
                  { icon: "shop", value: "7", label: "Product Categories" },
                  { icon: "people", value: "25", label: "Years of Industry Experience" }
                ]).map((stat: any, i: number) => {
                  // Dynamically replace product/category count values
                  let displayValue = stat.value || stat.val;
                  const lbl = stat.label?.toLowerCase() || "";
                  if (websiteContent?.counts) {
                    if (lbl.includes("product") && !lbl.includes("categor")) {
                      displayValue = String(websiteContent.counts.products);
                    } else if (lbl.includes("categor")) {
                      displayValue = String(websiteContent.counts.categories);
                    }
                  }
                  return (
                    <div key={i} className="col-6 col-lg-6">
                      <div className="stats-item d-flex">
                        <i className={`bi bi-${stat.icon} flex-shrink-0`}></i>
                        <div>
                          <span style={{ color: 'var(--heading-color)', fontSize: '40px', display: 'block', fontWeight: 700, lineHeight: '40px' }}>{displayValue}</span>
                          <p><strong dangerouslySetInnerHTML={{ __html: stat.label }} /></p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="testimonials section dark-background">
          <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566402/hallmark/assets/img/testimonials-bg.jpg" className="testimonials-bg img-fluid" alt="" />
          <div className="container" data-aos="fade-up" data-aos-delay="100">
            <div className="swiper init-swiper">
              <script type="application/json" className="swiper-config">
                {`
              {
                "loop": true,
                "speed": 600,
                "observer": true,
                "observeParents": true,
                "autoplay": {
                  "delay": 5000
                },
                "slidesPerView": "auto",
                "pagination": {
                  "el": ".swiper-pagination",
                  "type": "bullets",
                  "clickable": true
                }
              }
              `}
              </script>
              <div className="swiper-wrapper">
                {testimonialsLoading ? (
                  <div className="swiper-slide text-center py-5">
                    <div className="spinner-border text-light" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : testimonials.length > 0 ? (
                  testimonials.map((t, i) => (
                    <div key={t.id} className="swiper-slide">
                      <div className="testimonial-item">
                        <img src={[
                          "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566396/hallmark/assets/img/testimonials/testimonials-1.jpg",
                          "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566397/hallmark/assets/img/testimonials/testimonials-2.jpg",
                          "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566398/hallmark/assets/img/testimonials/testimonials-3.jpg",
                          "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566399/hallmark/assets/img/testimonials/testimonials-4.jpg",
                          "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566401/hallmark/assets/img/testimonials/testimonials-5.jpg",
                        ][i % 5]} className="testimonial-img" alt="" />
                        <h3>{t.name}</h3>
                        <h4>{t.role}</h4>
                        <div className="stars">
                          {[...Array(t.rating || 5)].map((_, j) => (
                            <i key={j} className="bi bi-star-fill"></i>
                          ))}
                        </div>
                        <p>
                          <i className="bi bi-quote quote-icon-left"></i>
                          <span>{t.quote}</span>
                          <i className="bi bi-quote quote-icon-right"></i>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="swiper-slide text-center py-5">
                    <p className="text-light">No testimonials available at the moment.</p>
                  </div>
                )}
              </div>
              <div className="swiper-pagination"></div>
            </div>
          </div>
        </section>
      )}

      {/* Investors Section */}
      <section id="investors" className="investors section position-relative" style={{ backgroundColor: '#111', color: '#fff', padding: '100px 0', borderTop: '4px solid #ffc451', overflow: 'hidden' }}>
        {/* Background decorative elements */}
        <div className="position-absolute top-0 end-0 opacity-25" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, #ffc451 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}></div>
        <div className="position-absolute bottom-0 start-0 opacity-25" style={{ width: '300px', height: '300px', background: 'radial-gradient(circle, #ffc451 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}></div>

        <div className="container position-relative z-1" data-aos="fade-up">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-8">
              <span className="badge rounded-pill px-4 py-2 mb-3" style={{ backgroundColor: 'rgba(255, 196, 81, 0.1)', color: '#ffc451', border: '1px solid rgba(255, 196, 81, 0.2)', fontSize: '0.9rem' }}>
                <i className="bi bi-graph-up-arrow me-2"></i>{websiteContent?.investors?.badgeText || "Investment Opportunities"}
              </span>
              <h2 className="fw-bold mb-4 text-white" style={{ fontSize: '3rem' }}>{websiteContent?.investors?.titleLight || "Partner in Our"} <span style={{ color: '#ffc451' }}>{websiteContent?.investors?.titleBold || "Growth"}</span></h2>
              <p className="lead mx-auto" style={{ maxWidth: '800px', fontSize: '1.2rem', color: '#e0e0e0' }}>
                {websiteContent?.investors?.description || "Join Hallmark Enterprises as an investor and become part of a rapidly expanding FMCG market leader. We offer structured returns backed by real-world distribution and substantial market presence."}
              </p>
            </div>
          </div>

          <div className="row g-4 mb-5">
            {/* Value Proposition Cards */}
            {(websiteContent?.investors?.cards || [
              { icon: "bi-bar-chart-fill", title: "Assured ROI", description: "Benefit from consistent, performance-linked returns driven by our high-turnover consumer goods portfolio." },
              { icon: "bi-shield-check", title: "Transparent Operations", description: "We believe in complete transparency. Our robust business model and supply chain are open to rigorous assessment." },
              { icon: "bi-globe-central-south-asia", title: "Scalable Expansion", description: "Capitalize on our aggressive expansion plans across India and the Gulf region, unlocking massive growth potential." }
            ]).map((card, i) => (
              <div key={i} className="col-md-4" data-aos="fade-up" data-aos-delay={100 + i * 100}>
                <div className="p-4 h-100 rounded-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', transition: 'transform 0.3s ease, border-color 0.3s ease' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = '#ffc451'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#333'; }}>
                  <div className="mb-3 d-inline-flex align-items-center justify-content-center rounded-circle" style={{ backgroundColor: 'rgba(255, 196, 81, 0.1)', width: '64px', height: '64px' }}>
                    <i className={`bi ${card.icon} fs-3`} style={{ color: '#ffc451' }}></i>
                  </div>
                  <h4 className="fw-bold mb-3 text-white">{card.title}</h4>
                  <p className="mb-0" style={{ color: '#ccc' }}>{card.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center" data-aos="zoom-in" data-aos-delay="400">
            <div className="d-inline-block p-2 rounded-pill" style={{ backgroundColor: '#222', border: '1px solid #444' }}>
              <button
                onClick={() => setIsInvestOpen(true)}
                className="btn btn-lg px-5 py-3 rounded-pill fw-bold text-dark d-inline-flex align-items-center justify-content-center gap-2 m-0"
                style={{ backgroundColor: '#ffc451', border: 'none', transition: 'all 0.3s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(255, 196, 81, 0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Express Your Interest <i className="bi bi-arrow-right fs-5"></i>
              </button>
            </div>
            <p className="mt-4 small" style={{ color: '#aaa' }}><i className="bi bi-shield-lock me-1"></i> {websiteContent?.investors?.bottomText || "Minimum investment commitments apply. Complete confidentiality maintained."}</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Contact</h2>
          <p>Contact Us</p>
        </div>
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="mb-4" data-aos="fade-up" data-aos-delay="200">
            <div className="ratio ratio-16x9">
              <iframe style={{ border: 0 }} src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15752.970708309695!2d76.66946996843613!3d9.222578203546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06172717978767%3A0x8f1885cdfa41a69!2sPandalam%2C%20Kerala%2C%20India!5e0!3m2!1sen!2sae!4v1774271652681!5m2!1sen!2sae" frameBorder="0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>
          <div className="row gy-4">
            <div className="col-lg-4">
              <div className="info-item d-flex" data-aos="fade-up" data-aos-delay="300">
                <i className="bi bi-geo-alt flex-shrink-0"></i>
                <div className="w-100">
                  <h3>Address</h3>
                  <AddressTabs />
                </div>
              </div>
              <div className="info-item d-flex" data-aos="fade-up" data-aos-delay="400">
                <i className="bi bi-telephone flex-shrink-0"></i>
                <div>
                  <h3>Call Us</h3>
                  <p>+91 894 3051 632</p>
                </div>
              </div>
              <div className="info-item d-flex" data-aos="fade-up" data-aos-delay="500">
                <i className="bi bi-envelope flex-shrink-0"></i>
                <div>
                  <h3>Email Us</h3>
                  <p>care@hallmarkworld.com</p>
                </div>
              </div>
            </div>
            <div className="col-lg-8">
              <form onSubmit={handleContactSubmit} className="php-email-form">
                <div className="row gy-4">
                  <div className="col-md-6">
                    <input type="text" name="name" className="form-control" placeholder="Your Name" required />
                  </div>
                  <div className="col-md-6">
                    <input type="email" className="form-control" name="email" placeholder="Your Email" required />
                  </div>
                  <div className="col-md-12">
                    <input type="text" className="form-control" name="phone" placeholder="Phone Number" required />
                  </div>
                  <div className="col-md-12">
                    <textarea className="form-control" name="message" rows={6} placeholder="Message" required></textarea>
                  </div>
                  <div className="col-md-12">
                    {contactState.error && <div className="alert alert-danger p-2 mb-3">{contactState.error}</div>}
                    {contactState.success && <div className="alert alert-success p-2 mb-3">Your message has been sent. Thank you!</div>}
                  </div>
                  <div className="col-md-12 text-center">
                    <button type="submit" className="btn btn-primary" disabled={contactState.loading}>
                      {contactState.loading ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
