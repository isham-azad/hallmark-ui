import Link from "next/link";
import { Product } from "@/data/products";

interface ProductCardProps {
    product: Product;
    index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
    return (
        <div className="product-card service-item position-relative d-flex flex-column h-100" style={{ padding: '0', overflow: 'hidden', border: '1px solid color-mix(in srgb, var(--default-color), transparent 90%)', borderRadius: '15px', transition: 'all 0.4s ease', backgroundColor: 'var(--surface-color)', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
            <Link href={`/shop/product/${product.id}`} className="product-card-img" style={{ overflow: 'hidden', position: 'relative', display: 'block', height: '220px', backgroundColor: '#ffffff' }}>
                <img
                    src={product.image ? product.image.split(',').filter(Boolean)[0] : "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566376/hallmark/assets/img/masonry-portfolio/masonry-portfolio-1.jpg"}
                    alt={product.title}
                    className="img-fluid"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px', transition: 'transform 0.6s ease' }}
                />
                <div className="category-badge" style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: '#198754', padding: '5px 12px', borderRadius: '30px', fontSize: '0.65rem', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: '2' }}>
                    {product.category.replace("-", " ")}
                </div>
            </Link>
            <div className="product-card-content p-3 p-md-4 d-flex flex-column flex-grow-1">
                <h3 className="product-card-title" style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "12px", textAlign: "left", color: 'var(--heading-color)', transition: '0.3s' }}>{product.title}</h3>
                <p className="product-card-desc flex-grow-1" style={{ textAlign: "left", color: "color-mix(in srgb, var(--default-color), transparent 30%)", lineHeight: "1.6", display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.desc}</p>
                <Link href={`/shop/product/${product.id}`} className="product-card-link mt-3 pt-3 border-top d-flex align-items-center" style={{ color: 'var(--accent-color)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', textDecoration: 'none' }}>
                    <span>Explore Product</span>
                    <i className="bi bi-arrow-right ms-2" style={{ transition: 'margin-left 0.3s ease' }}></i>
                </Link>
            </div>
        </div>
    );
}
