"use client";

import Link from "next/link";

export default function ServiceDetailsPage() {
    return (
        <>
            <div className="page-title mt-5" data-aos="fade">
                <div className="heading">
                    <div className="container">
                        <div className="row d-flex justify-content-center text-center">
                            <div className="col-lg-8">
                                <h1>Service Details</h1>
                                <p className="mb-0">Explore our comprehensive range of services tailored to meet your wholesale and food processing needs.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <nav className="breadcrumbs">
                    <div className="container">
                        <ol>
                            <li><Link href="/">Home</Link></li>
                            <li className="current">Service Details</li>
                        </ol>
                    </div>
                </nav>
            </div>

            <section id="service-details" className="service-details section">
                <div className="container">
                    <div className="row gy-5">
                        <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
                            <div className="service-box p-4 border rounded mb-4">
                                <h4>Services List</h4>
                                <div className="services-list d-flex flex-column gap-2 mt-3">
                                    <a href="#" className="active d-flex align-items-center gap-2"><i className="bi bi-arrow-right-circle"></i><span>Wholesale Distribution</span></a>
                                    <a href="#" className="d-flex align-items-center gap-2"><i className="bi bi-arrow-right-circle"></i><span>Food Processing</span></a>
                                    <a href="#" className="d-flex align-items-center gap-2"><i className="bi bi-arrow-right-circle"></i><span>Supply Chain Management</span></a>
                                    <a href="#" className="d-flex align-items-center gap-2"><i className="bi bi-arrow-right-circle"></i><span>Quality Assurance</span></a>
                                    <a href="#" className="d-flex align-items-center gap-2"><i className="bi bi-arrow-right-circle"></i><span>Logistics & Delivery</span></a>
                                </div>
                            </div>

                            <div className="service-box p-4 border rounded mb-4">
                                <h4>Download Catalog</h4>
                                <div className="download-catalog d-flex flex-column gap-2 mt-3">
                                    <a href="#" className="d-flex align-items-center gap-2"><i className="bi bi-filetype-pdf"></i><span>Catalog PDF</span></a>
                                    <a href="#" className="d-flex align-items-center gap-2"><i className="bi bi-file-earmark-word"></i><span>Catalog DOC</span></a>
                                </div>
                            </div>

                            <div className="help-box d-flex flex-column justify-content-center align-items-center p-4 bg-primary text-white rounded">
                                <i className="bi bi-headset help-icon" style={{ fontSize: "48px" }}></i>
                                <h4 className="mt-3">Have a Question?</h4>
                                <p className="d-flex align-items-center mt-2 mb-0"><i className="bi bi-telephone me-2"></i> <span>+1 5589 55488 55</span></p>
                                <p className="d-flex align-items-center mt-1 mb-0"><i className="bi bi-envelope me-2"></i> <a href="mailto:contact@example.com" className="text-white">contact@example.com</a></p>
                            </div>
                        </div>

                        <div className="col-lg-8 ps-lg-5" data-aos="fade-up" data-aos-delay="200">
                            <img src="/assets/img/services.jpg" alt="" className="img-fluid services-img mb-4 rounded" />
                            <h3>Premium Wholesale and Food Processing Services</h3>
                            <p>
                                At HallMark Enterprises, we pride ourselves on delivering top-tier wholesale distribution and food processing services. Our commitment to quality and efficiency ensures that our clients receive the best products in the most timely manner.
                            </p>
                            <ul className="list-unstyled">
                                <li className="d-flex align-items-center mb-2"><i className="bi bi-check-circle text-primary me-2"></i> <span>State-of-the-art processing facilities.</span></li>
                                <li className="d-flex align-items-center mb-2"><i className="bi bi-check-circle text-primary me-2"></i> <span>Wide network of reliable suppliers.</span></li>
                                <li className="d-flex align-items-center mb-2"><i className="bi bi-check-circle text-primary me-2"></i> <span>Efficient logistics and distribution system.</span></li>
                            </ul>
                            <p>
                                We understand the complexities of the food industry and have built our processes to meet the highest standards of safety and quality. Whether you're looking for fresh produce, processed goods, or supply chain solutions, we have the expertise to support your business.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
