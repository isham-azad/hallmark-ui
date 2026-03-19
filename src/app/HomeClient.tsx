"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import { ProductCardShimmer, ShimmerBox } from "@/components/Shimmer";

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

export default function HomeClient() {
  const { addToCart } = useCart();
  const [contactState, setContactState] = useState({ loading: false, success: false, error: "" });

  useEffect(() => {
    // Manually trigger Swiper initialization after component mounts
    // This ensures sliders work even if main.js ran before hydration
    const initSwiper = () => {
      if (typeof window !== "undefined" && (window as any).Swiper) {
        document.querySelectorAll(".init-swiper").forEach(function (swiperElement) {
          if (!swiperElement.classList.contains("swiper-initialized")) {
            const configEl = swiperElement.querySelector(".swiper-config");
            if (configEl) {
              try {
                let config = JSON.parse(configEl.innerHTML.trim());

                // For navigation buttons outside the swiper container, 
                // we ensure they are correctly linked if they exist
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

    // Try immediately and also after a short delay
    initSwiper();
    const timer = setTimeout(initSwiper, 500);
    return () => clearTimeout(timer);
  }, []);

  const [currentFeature, setCurrentFeature] = useState(0);
  const [products, setProducts] = useState<SiteProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [brands, setBrands] = useState<SiteBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<SiteTestimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const featureImages = ["https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566403/hallmark/assets/img/value.png", "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566390/hallmark/assets/img/satisfaction.png", "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566365/hallmark/assets/img/happiness.png"];

  useEffect(() => {
    fetch("/api/site/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));

    fetch("/api/site/brands")
      .then((res) => res.json())
      .then((data) => setBrands(data.brands ?? []))
      .catch(() => setBrands([]))
      .finally(() => setBrandsLoading(false));

    fetch("/api/site/testimonials")
      .then((res) => res.json())
      .then((data) => setTestimonials(data.testimonials ?? []))
      .catch(() => setTestimonials([]))
      .finally(() => setTestimonialsLoading(false));
  }, []);

  useEffect(() => {
    const featureInterval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % featureImages.length);
    }, 3000);
    return () => clearInterval(featureInterval);
  }, []);

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

  console.log(brands)

  return (
    <>
      {/* Hero Section */}
      <section id="hero" className="hero section dark-background">
        <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566373/hallmark/assets/img/hero-bg-2.png" alt="" className="img-fluid" data-aos="fade-in" />
        <div className="container">
          <div className="row justify-content-center text-center" data-aos="fade-up" data-aos-delay="100">
            <div className="col-xl-6 col-lg-8">
              <h2 className="responsive-h2"><span>Hallmark</span> Enterprises</h2>
              <p className="responsive-p">"All because we understand you better"</p>
            </div>
          </div>
          <div className="row flex-wrap flex-lg-nowrap justify-content-center mt-5 gx-2 gy-3 hero-icon-grid" data-aos="fade-up" data-aos-delay="200">
            <div className="col-4 col-md-4 col-lg" data-aos="fade-up" data-aos-delay="300">
              <div className="icon-box">
                <i className="bi bi-house-door-fill"></i>
                <h3><a href="">Home Care</a></h3>
              </div>
            </div>
            <div className="col-4 col-md-4 col-lg" data-aos="fade-up" data-aos-delay="400">
              <div className="icon-box">
                <i className="fa fa-shirt"></i>
                <h3><a href="">Fabric Care</a></h3>
              </div>
            </div>
            <div className="col-4 col-md-4 col-lg" data-aos="fade-up" data-aos-delay="500">
              <div className="icon-box">
                <i className="bi bi-person-hearts"></i>
                <h3><a href="">Personal Care</a></h3>
              </div>
            </div>
            <div className="col-4 col-md-4 col-lg" data-aos="fade-up" data-aos-delay="600">
              <div className="icon-box">
                <i className="bi bi-droplet-fill"></i>
                <h3><a href="">Cleaning Liquids</a></h3>
              </div>
            </div>
            <div className="col-4 col-md-4 col-lg" data-aos="fade-up" data-aos-delay="700">
              <div className="icon-box">
                <i className="bi bi-stars"></i>
                <h3><a href="">Fancy Supplies</a></h3>
              </div>
            </div>
            <div className="col-4 col-md-4 col-lg" data-aos="fade-up" data-aos-delay="800">
              <div className="icon-box">
                <i className="bi bi-cup-straw"></i>
                <h3><a href="">Food &amp; Beverages</a></h3>
              </div>
            </div>
            <div className="col-4 col-md-4 col-lg" data-aos="fade-up" data-aos-delay="900">
              <div className="icon-box">
                <i className="bi bi-sun"></i>
                <h3><a href="">Ritual Essentials</a></h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about section">
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="row gy-4">
            <div className="col-lg-6 order-1 order-lg-2">
              <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566351/hallmark/assets/img/about.jpg" className="img-fluid" alt="" />
            </div>
            <div className="col-lg-6 order-2 order-lg-1 content">
              <h3>Hallmark Enterprises</h3>
              <p style={{ textAlign: "justify" }}>
                Established in 2014, Hallmark Enterprises is a consumer-focused company committed to delivering high-quality, affordable essentials for everyday living. Founded by <b>Mr. Vinod Bhaskaran</b>, who brings over 25 years of experience in retail marketing and channel sales across India and the Gulf, Hallmark combines market expertise with a strong value-driven approach.
              </p>
              <p style={{ textAlign: "justify" }}>
                Hallmark began with a trusted range of home care products including <b>Soph Detergent Liquid, Soph Dishwash Liquid, Soph Handwash, Soph Washing Powder, Emitol Floor Cleaner and Emitol Toilet Cleaner</b>, which quickly gained market acceptance for their quality and reliability.
              </p>
              <p style={{ textAlign: "justify" }}>
                Expanding beyond home care, Hallmark has entered the food and grocery segment with:
              </p>
              <ul style={{ textAlign: "justify" }}>
                <li><i className="bi bi-check2-all"></i> <span><b>PDM Maharaja</b> – spices and dry fruits</span></li>
                <li><i className="bi bi-check2-all"></i> <span><b>Vita Rich</b> – pulses, masala items, rice flakes, and daily staples</span></li>
              </ul>
              <p style={{ textAlign: "justify" }}>
                With a strong focus on quality, affordability, and long-term partnerships, Hallmark continues to serve households and retailers with dependable products that meet every day needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section id="clients" className="clients section">
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
                    "spaceBetween": 120
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
                <h3>All because we understand you better</h3>
                <p>From home care to food and grocery essentials, Hallmark Enterprises delivers trusted quality and real value to homes across the region. Explore our full range of products and discover the Hallmark difference.</p>
                <a className="cta-btn" href="/shop">Shop Online</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats section">
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="row gy-4 align-items-center justify-content-between">
            <div className="col-lg-5">
              <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566392/hallmark/assets/img/stats-img.jpg" alt="" className="img-fluid" />
            </div>
            <div className="col-lg-6">
              <h3 className="fw-bold fs-2 mb-3">Trusted by homes across India &amp; the Gulf</h3>
              <p>
                Since 2014, Hallmark Enterprises has been delivering high-quality, affordable essentials with a commitment to value, satisfaction, and happiness—every single day.
              </p>
              <div className="row gy-4">
                {[
                  { icon: "emoji-smile", val: "10", label: "Years of Excellence" },
                  { icon: "box-seam", val: "26", label: "Products &amp; Growing" },
                  { icon: "shop", val: "7", label: "Product Categories" },
                  { icon: "people", val: "25", label: "Years of Industry Experience" }
                ].map((stat, i) => (
                  <div key={i} className="col-6 col-lg-6">
                    <div className="stats-item d-flex">
                      <i className={`bi bi-${stat.icon} flex-shrink-0`}></i>
                      <div>
                        <span data-purecounter-start="0" data-purecounter-end={stat.val} data-purecounter-duration="1" className="purecounter"></span>
                        <p><strong dangerouslySetInnerHTML={{ __html: stat.label }} /></p>
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Contact Section */}
      <section id="contact" className="contact section">
        <div className="container section-title" data-aos="fade-up">
          <h2>Contact</h2>
          <p>Contact Us</p>
        </div>
        <div className="container" data-aos="fade-up" data-aos-delay="100">
          <div className="mb-4" data-aos="fade-up" data-aos-delay="200">
            <div className="ratio ratio-16x9">
              <iframe style={{ border: 0 }} src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d48389.78314118045!2d-74.006138!3d40.710059!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a22a3bda30d%3A0xb89d1fe6bc499443!2sDowntown%20Conference%20Center!5e0!3m2!1sen!2sus!4v1676961268712!5m2!1sen!2sus" frameBorder="0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
          </div>
          <div className="row gy-4">
            <div className="col-lg-4">
              <div className="info-item d-flex" data-aos="fade-up" data-aos-delay="300">
                <i className="bi bi-geo-alt flex-shrink-0"></i>
                <div>
                  <h3>Address</h3>
                  <p>Hallmark Enterprises, Kerala, India</p>
                </div>
              </div>
              <div className="info-item d-flex" data-aos="fade-up" data-aos-delay="400">
                <i className="bi bi-telephone flex-shrink-0"></i>
                <div>
                  <h3>Call Us</h3>
                  <p>+91 00000 00000</p>
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
