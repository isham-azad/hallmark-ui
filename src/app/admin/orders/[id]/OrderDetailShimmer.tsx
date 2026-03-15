"use client";

export function OrderDetailShimmer() {
    return (
        <div className="order-detail-shimmer-container">
            <div className="detail-header-shimmer">
                <div className="back-link-shimmer shimmer"></div>
                <div className="detail-header-row-shimmer">
                    <div className="detail-header-title-shimmer">
                        <div className="h1-shimmer shimmer"></div>
                        <div className="order-no-shimmer shimmer"></div>
                    </div>
                    <div className="detail-header-actions-shimmer">
                        <div className="header-btn-shimmer shimmer"></div>
                        <div className="header-btn-shimmer shimmer"></div>
                        <div className="header-btn-shimmer shimmer"></div>
                        <div className="header-btn-shimmer shimmer"></div>
                    </div>
                </div>
            </div>

            <div className="detail-card-shimmer">
                <div className="detail-grid-shimmer">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="detail-item-shimmer">
                            <div className="detail-label-shimmer shimmer"></div>
                            <div className="detail-value-shimmer shimmer"></div>
                        </div>
                    ))}
                    <div className="detail-item-shimmer full-row-shimmer">
                        <div className="detail-label-shimmer shimmer"></div>
                        <div className="detail-value-shimmer shimmer" style={{ height: '32px', width: '200px' }}></div>
                    </div>
                    {[...Array(2)].map((_, i) => (
                        <div key={i+10} className="detail-item-shimmer">
                            <div className="detail-label-shimmer shimmer"></div>
                            <div className="detail-value-shimmer shimmer"></div>
                        </div>
                    ))}
                    <div className="detail-item-shimmer full-row-shimmer">
                        <div className="detail-label-shimmer shimmer"></div>
                        <div className="detail-value-shimmer shimmer" style={{ height: '60px' }}></div>
                    </div>
                    <div className="detail-item-shimmer full-row-shimmer">
                        <div className="detail-label-shimmer shimmer"></div>
                        <div className="detail-value-shimmer shimmer" style={{ height: '60px' }}></div>
                    </div>
                </div>

                <div className="items-section-shimmer">
                    <div className="items-title-shimmer shimmer"></div>
                    
                    {/* Desktop Table View */}
                    <div className="items-table-shimmer hide-mobile-shimmer">
                        <div className="table-row-shimmer head shimmer"></div>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="table-row-shimmer item">
                                <div className="img-shimmer shimmer"></div>
                                <div className="text-shimmer shimmer"></div>
                                <div className="text-shimmer shimmer"></div>
                                <div className="text-shimmer shimmer" style={{ width: '40px' }}></div>
                                <div className="text-shimmer shimmer" style={{ width: '80px' }}></div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Card View */}
                    <div className="items-cards-shimmer show-mobile-shimmer">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="item-card-shimmer">
                                <div className="card-header-shimmer">
                                    <div className="img-shimmer shimmer"></div>
                                    <div className="card-title-wrap-shimmer">
                                        <div className="card-name-shimmer shimmer"></div>
                                        <div className="card-qty-shimmer shimmer"></div>
                                    </div>
                                </div>
                                <div className="card-body-shimmer">
                                    <div className="card-sku-shimmer shimmer"></div>
                                    <div className="card-price-shimmer shimmer"></div>
                                </div>
                                <div className="card-footer-shimmer">
                                    <div className="card-footer-label-shimmer shimmer"></div>
                                    <div className="card-footer-value-shimmer shimmer"></div>
                                </div>
                            </div>
                        ))}
                        <div className="mobile-total-block-shimmer shimmer"></div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .order-detail-shimmer-container { padding: 0; }
                .shimmer {
                    background: #f1f5f9;
                    background: linear-gradient(90deg, #f1f5f9 25%, #f8fafc 50%, #f1f5f9 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 8px;
                }
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                
                .detail-header-shimmer { margin-bottom: 2rem; }
                .back-link-shimmer { width: 140px; height: 20px; margin-bottom: 1rem; border-radius: 4px; }
                .detail-header-row-shimmer { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; }
                .h1-shimmer { width: 200px; height: 32px; margin-bottom: 0.5rem; }
                .order-no-shimmer { width: 120px; height: 16px; border-radius: 4px; }
                .detail-header-actions-shimmer { display: flex; gap: 0.5rem; }
                .header-btn-shimmer { width: 40px; height: 40px; border-radius: 12px; }
                
                .detail-card-shimmer { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; padding: 2rem; }
                .detail-grid-shimmer { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
                .detail-item-shimmer { display: flex; flex-direction: column; gap: 0.5rem; }
                .detail-label-shimmer { width: 80px; height: 12px; border-radius: 4px; }
                .detail-value-shimmer { width: 100%; height: 20px; border-radius: 6px; }
                .full-row-shimmer { grid-column: 1 / -1; }
                
                .items-section-shimmer { margin-top: 2rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
                .items-title-shimmer { width: 120px; height: 14px; margin-bottom: 1.5rem; border-radius: 4px; }
                
                .items-table-shimmer { display: flex; flex-direction: column; gap: 1rem; }
                .table-row-shimmer.head { height: 40px; }
                .table-row-shimmer.item { display: grid; grid-template-columns: 60px 1fr 150px 60px 100px; gap: 1rem; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f8fafc; }
                .img-shimmer { width: 44px; height: 44px; border-radius: 10px; }
                .text-shimmer { height: 16px; width: 100%; border-radius: 4px; }

                .items-cards-shimmer { display: none; flex-direction: column; gap: 1rem; }
                .item-card-shimmer { background: #fff; border-radius: 16px; padding: 1.25rem; border: 1px solid #f1f5f9; }
                .card-header-shimmer { display: flex; gap: 1rem; margin-bottom: 1rem; }
                .card-title-wrap-shimmer { flex: 1; display: flex; justify-content: space-between; align-items: flex-start; }
                .card-name-shimmer { width: 120px; height: 18px; }
                .card-qty-shimmer { width: 40px; height: 24px; border-radius: 6px; }
                .card-body-shimmer { display: flex; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px dashed #e2e8f0; }
                .card-sku-shimmer { width: 80px; height: 14px; }
                .card-price-shimmer { width: 60px; height: 16px; }
                .card-footer-shimmer { display: flex; justify-content: space-between; }
                .card-footer-label-shimmer { width: 70px; height: 12px; }
                .card-footer-value-shimmer { width: 60px; height: 18px; }
                .mobile-total-block-shimmer { height: 70px; border-radius: 16px; margin-top: 1rem; }

                .hide-mobile-shimmer { display: flex; }
                .show-mobile-shimmer { display: none; }

                @media (max-width: 768px) {
                    .detail-header-shimmer { margin-bottom: 1.5rem; }
                    .detail-header-row-shimmer { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .detail-header-actions-shimmer { width: 100%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
                    .header-btn-shimmer { width: 100%; height: 48px; border-radius: 12px; }
                    
                    .detail-card-shimmer { padding: 1.25rem; background: transparent; border: none; }
                    .detail-grid-shimmer { 
                        display: grid; 
                        grid-template-columns: repeat(2, 1fr); 
                        gap: 1.25rem; 
                        background: #fff; 
                        border-radius: 24px; 
                        padding: 1.5rem; 
                        border: 1px solid #f1f5f9;
                    }
                    .detail-item-shimmer.email-row { grid-column: 1 / -1; }
                    
                    .hide-mobile-shimmer { display: none; }
                    .show-mobile-shimmer { display: flex; }
                }

                @media (max-width: 480px) {
                    .detail-grid-shimmer { gap: 1rem; padding: 1.25rem; }
                }
            `}</style>
        </div>
    );
}
