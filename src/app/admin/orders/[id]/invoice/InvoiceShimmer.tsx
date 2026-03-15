"use client";

export function InvoiceShimmer() {
    return (
        <div className="invoice-shimmer-container">
            <div className="invoice-actions-shimmer no-print">
                <div className="back-link-shimmer shimmer"></div>
                <div className="print-btn-shimmer shimmer"></div>
            </div>

            <div className="invoice-paper-shimmer">
                <header className="invoice-header-shimmer">
                    <div className="header-text-shimmer">
                        <div className="title-shimmer shimmer"></div>
                        <div className="order-no-shimmer shimmer"></div>
                    </div>
                    <div className="logo-shimmer shimmer"></div>
                </header>

                <div className="invoice-meta-shimmer">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="meta-item-shimmer">
                            <div className="meta-label-shimmer shimmer"></div>
                            <div className="meta-value-shimmer shimmer"></div>
                        </div>
                    ))}
                    <div className="meta-item-shimmer full-width-shimmer">
                        <div className="meta-label-shimmer shimmer"></div>
                        <div className="meta-value-shimmer shimmer" style={{ height: '40px' }}></div>
                    </div>
                </div>

                <div className="invoice-table-shimmer">
                    <div className="table-head-shimmer shimmer"></div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="table-row-shimmer">
                            <div className="img-shimmer shimmer"></div>
                            <div className="name-shimmer shimmer"></div>
                            <div className="sku-shimmer shimmer"></div>
                            <div className="qty-shimmer shimmer"></div>
                            <div className="price-shimmer shimmer"></div>
                        </div>
                    ))}
                </div>

                <div className="invoice-summary-shimmer">
                    <div className="summary-total-shimmer">
                        <div className="summary-label-shimmer shimmer"></div>
                        <div className="summary-value-shimmer shimmer"></div>
                    </div>
                </div>

                <div className="invoice-footer-shimmer">
                    <div className="qr-box-shimmer shimmer"></div>
                    <div className="thank-you-shimmer shimmer"></div>
                </div>
            </div>

            <style jsx>{`
                .invoice-shimmer-container { padding: 2rem; max-width: 800px; margin: 0 auto; }
                .shimmer {
                    background: #f1f5f9;
                    background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 8px;
                }
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

                .invoice-actions-shimmer { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .back-link-shimmer { width: 120px; height: 20px; }
                .print-btn-shimmer { width: 180px; height: 44px; border-radius: 12px; }

                .invoice-paper-shimmer { background: #fff; padding: 2.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
                .invoice-header-shimmer { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #f8fafc; }
                .title-shimmer { width: 140px; height: 32px; margin-bottom: 0.5rem; }
                .order-no-shimmer { width: 100px; height: 16px; }
                .logo-shimmer { width: 120px; height: 40px; }

                .invoice-meta-shimmer { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem 2rem; margin-bottom: 2rem; }
                .meta-item-shimmer { display: flex; flex-direction: column; gap: 0.5rem; }
                .meta-label-shimmer { width: 70px; height: 12px; }
                .meta-value-shimmer { width: 100%; height: 20px; }
                .full-width-shimmer { grid-column: span 2; }

                .invoice-table-shimmer { margin-bottom: 2rem; }
                .table-head-shimmer { height: 40px; margin-bottom: 1rem; }
                .table-row-shimmer { display: grid; grid-template-columns: 50px 1fr 100px 50px 80px; gap: 1rem; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f8fafc; }
                .img-shimmer { width: 40px; height: 40px; border-radius: 6px; }
                .name-shimmer { width: 80%; height: 16px; }
                .sku-shimmer { width: 60px; height: 14px; }
                .qty-shimmer { width: 30px; height: 16px; }
                .price-shimmer { width: 60px; height: 16px; }

                .invoice-summary-shimmer { margin-top: 1rem; border-top: 2px solid #f8fafc; padding-top: 1.5rem; }
                .summary-total-shimmer { display: flex; justify-content: space-between; align-items: center; }
                .summary-label-shimmer { width: 100px; height: 16px; }
                .summary-value-shimmer { width: 120px; height: 32px; }

                .invoice-footer-shimmer { margin-top: 4rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
                .qr-box-shimmer { width: 180px; height: 180px; border-radius: 16px; }
                .thank-you-shimmer { width: 200px; height: 16px; }

                @media (max-width: 768px) {
                    .invoice-shimmer-container { padding: 1rem; }
                    .invoice-meta-shimmer { grid-template-columns: 1fr; gap: 1rem; }
                    .table-row-shimmer { grid-template-columns: 40px 1fr 40px 70px; }
                    .sku-shimmer { display: none; }
                }
            `}</style>
        </div>
    );
}
