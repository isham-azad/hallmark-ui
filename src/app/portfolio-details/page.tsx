"use client";

import Link from "next/link";

export default function PortfolioDetailsPage() {
    return (
        <>
            <div className="page-title mt-5" data-aos="fade">
                <div className="heading">
                    <div className="container">
                        <div className="row d-flex justify-content-center text-center">
                            <div className="col-lg-8">
                                <h1>Portfolio Details</h1>
                                <p className="mb-0">A detailed look at our successful projects and processing facilities.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="breadcrumbs">
                    <div className="container">
                        <ol>
                            <li><Link href="/">Home</Link></li>
                            <li className="current">Portfolio Details</li>
                        </ol>
                    </div>
                </nav>
            </div>

            <section id="portfolio-details" className="portfolio-details section">
                <div className="container" data-aos="fade-up" data-aos-delay="100">
                    <div className="row gy-4">
                        <div className="col-lg-8">
                            <div className="portfolio-details-slider swiper init-swiper">
                                <div className="swiper-wrapper align-items-center">
                                    <div className="swiper-slide">
                                        <img src="https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566386/hallmark/assets/img/portfolio/app-1.jpg" alt="" className="img-fluid rounded" />
                                    </div>
                                </div>
                                <div className="swiper-pagination"></div>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="portfolio-info p-4 border rounded mb-4" data-aos="fade-up" data-aos-delay="200">
                                <h3>Project information</h3>
                                <ul className="list-unstyled mt-3">
                                    <li className="mb-2"><strong>Category</strong>: Food Processing</li>
                                    <li className="mb-2"><strong>Client</strong>: Global Foods Co.</li>
                                    <li className="mb-2"><strong>Project date</strong>: 01 March, 2024</li>
                                    <li className="mb-2"><strong>Project URL</strong>: <a href="#" className="text-primary">www.hallmark.com</a></li>
                                </ul>
                            </div>
                            <div className="portfolio-description" data-aos="fade-up" data-aos-delay="300">
                                <h2>Advanced Food Processing Facility</h2>
                                <p>
                                    This project involved the setup and management of a high-capacity food processing facility. We implemented the latest technologies to ensure maximum efficiency and quality control.
                                </p>
                                <p>
                                    The facility handles a variety of products, from grains and pulses to fresh vegetables, ensuring that all items are processed according to international standards.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
