"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateSeoSettings, SeoSettings, PageSeo } from "./actions";
import { useAdminToast } from "@/components/AdminToast";

interface SeoClientProps {
    initialData: SeoSettings;
}

type TabType = 
    | "global" 
    | "home" 
    | "shop" 
    | "b2b" 
    | "b2bAccount" 
    | "cart" 
    | "checkout" 
    | "orderSuccess" 
    | "portfolioDetails" 
    | "productDetails" 
    | "scripts";

export default function SeoClient({ initialData }: SeoClientProps) {
    const router = useRouter();
    const { showToast, ToastComponent } = useAdminToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("global");
    
    const [formData, setFormData] = useState<SeoSettings>(initialData);

    // Single dynamic file input approach
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingSection, setUploadingSection] = useState<string | null>(null);

    const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({
        default: null,
        home: null,
        shop: null,
        b2b: null,
        b2bAccount: null,
        cart: null,
        checkout: null,
        orderSuccess: null,
        portfolioDetails: null,
        productDetails: null
    });

    const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({
        default: initialData.default?.ogImage || "",
        home: initialData.home?.ogImage || "",
        shop: initialData.shop?.ogImage || "",
        b2b: initialData.b2b?.ogImage || "",
        b2bAccount: initialData.b2bAccount?.ogImage || "",
        cart: initialData.cart?.ogImage || "",
        checkout: initialData.checkout?.ogImage || "",
        orderSuccess: initialData.orderSuccess?.ogImage || "",
        portfolioDetails: initialData.portfolioDetails?.ogImage || "",
        productDetails: initialData.productDetails?.ogImage || ""
    });

    // Update form state if initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setImagePreviews({
                default: initialData.default?.ogImage || "",
                home: initialData.home?.ogImage || "",
                shop: initialData.shop?.ogImage || "",
                b2b: initialData.b2b?.ogImage || "",
                b2bAccount: initialData.b2bAccount?.ogImage || "",
                cart: initialData.cart?.ogImage || "",
                checkout: initialData.checkout?.ogImage || "",
                orderSuccess: initialData.orderSuccess?.ogImage || "",
                portfolioDetails: initialData.portfolioDetails?.ogImage || "",
                productDetails: initialData.productDetails?.ogImage || ""
            });
        }
    }, [initialData]);

    const handleTextChange = (
        section: keyof Omit<SeoSettings, "googleAnalyticsId" | "facebookPixelId" | "customHeadScript" | "customBodyScript">,
        field: keyof PageSeo,
        value: string
    ) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const triggerImageUpload = (section: string) => {
        setUploadingSection(section);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/") && uploadingSection) {
            setImageFiles(prev => ({ ...prev, [uploadingSection]: file }));
            setImagePreviews(prev => ({ ...prev, [uploadingSection]: URL.createObjectURL(file) }));
        }
    };

    const handleUploadImage = async (file: File): Promise<string> => {
        const uploadFormData = new FormData();
        uploadFormData.append("images", file);
        uploadFormData.append("folder", "website/seo");
        const res = await fetch("/api/admin/website/upload", { method: "POST", body: uploadFormData });
        const result = await res.json();
        if (result.success && result.urls.length > 0) {
            return result.urls[0];
        }
        throw new Error(result.error || "Image upload failed");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updatedData = { ...formData };
            const sections = [
                "default", "home", "shop", "b2b", "b2bAccount", 
                "cart", "checkout", "orderSuccess", "portfolioDetails", "productDetails"
            ] as const;

            // Upload files that have been changed
            for (const section of sections) {
                const file = imageFiles[section];
                if (file) {
                    const uploadedUrl = await handleUploadImage(file);
                    updatedData[section].ogImage = uploadedUrl;
                }
            }

            const res = await updateSeoSettings(updatedData);
            if (res.success) {
                showToast("SEO settings updated successfully", "success");
                setImageFiles({
                    default: null, home: null, shop: null, b2b: null, b2bAccount: null,
                    cart: null, checkout: null, orderSuccess: null, portfolioDetails: null, productDetails: null
                });
                router.refresh();
            } else {
                showToast(res.error || "Failed to update SEO settings", "error");
            }
        } catch (error: any) {
            showToast(error.message || "An unexpected error occurred", "error");
        } finally {
            setLoading(false);
        }
    };

    const renderLengthIndicator = (current: number, min: number, max: number) => {
        const isValid = current >= min && current <= max;
        return (
            <span className={`length-indicator ${isValid ? "valid" : "warning"}`}>
                {current} / {max} {isValid ? "✓" : `(Ideal: ${min}-${max})`}
            </span>
        );
    };

    const getPageUrlMock = (section: string) => {
        switch (section) {
            case "home": return "https://hallmarkworld.com/";
            case "shop": return "https://hallmarkworld.com/shop";
            case "b2b": return "https://hallmarkworld.com/b2b/login";
            case "b2bAccount": return "https://hallmarkworld.com/b2b/account";
            case "cart": return "https://hallmarkworld.com/cart";
            case "checkout": return "https://hallmarkworld.com/checkout";
            case "orderSuccess": return "https://hallmarkworld.com/order-success";
            case "portfolioDetails": return "https://hallmarkworld.com/portfolio-details";
            case "productDetails": return "https://hallmarkworld.com/product-details";
            default: return "https://hallmarkworld.com/ [Default Fallback]";
        }
    };

    const renderPreviews = (section: keyof Omit<SeoSettings, "googleAnalyticsId" | "facebookPixelId" | "customHeadScript" | "customBodyScript">) => {
        const data = formData[section];
        const previewTitle = data?.title || "HallMark Enterprises";
        const previewDesc = data?.description || "A Wholesale Distributor & Food Processing Co.";
        const previewOgTitle = data?.ogTitle || previewTitle;
        const previewOgDesc = data?.ogDescription || previewDesc;
        const previewOgImage = imagePreviews[section] || "https://res.cloudinary.com/dif9yrwp2/image/upload/v1773566363/hallmark/assets/img/hero-bg-2.png";
        const mockUrl = getPageUrlMock(section);

        return (
            <div className="preview-section">
                <h5 className="preview-section-title"><i className="bi bi-eye"></i> Real-time Snippet Previews</h5>
                
                {/* Google Search Preview */}
                <div className="preview-card google-preview">
                    <span className="preview-label">Google Search Result</span>
                    <div className="google-url-row">
                        <span className="google-favicon">G</span>
                        <span className="google-url">{mockUrl}</span>
                    </div>
                    <div className="google-title">{previewTitle}</div>
                    <div className="google-desc">{previewDesc}</div>
                </div>

                {/* Social Card Preview */}
                <div className="preview-card social-preview">
                    <span className="preview-label">Social Media Card (OpenGraph)</span>
                    <div className="social-card">
                        <div className="social-img-wrap">
                            <img src={previewOgImage} alt="OG Card Preview" />
                        </div>
                        <div className="social-meta">
                            <div className="social-domain">HALLMARKWORLD.COM</div>
                            <div className="social-title">{previewOgTitle}</div>
                            <div className="social-desc">{previewOgDesc}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSeoInputs = (section: keyof Omit<SeoSettings, "googleAnalyticsId" | "facebookPixelId" | "customHeadScript" | "customBodyScript">) => {
        const data = formData[section] || { title: "", description: "", keywords: "", ogTitle: "", ogDescription: "" };
        return (
            <div className="seo-grid">
                <div className="seo-form-fields">
                    <div className="form-section-card">
                        <h5 className="card-sub-title">Search Appearance</h5>
                        
                        <div className="input-group">
                            <div className="label-with-meta">
                                <label>Meta Title Tag</label>
                                {renderLengthIndicator(data.title.length, 30, 60)}
                            </div>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => handleTextChange(section, "title", e.target.value)}
                                placeholder="Enter meta title tag"
                                required
                            />
                            <p className="hint">The title displayed in search engines and browser tabs.</p>
                        </div>

                        <div className="input-group">
                            <div className="label-with-meta">
                                <label>Meta Description</label>
                                {renderLengthIndicator(data.description.length, 120, 160)}
                            </div>
                            <textarea
                                rows={4}
                                value={data.description}
                                onChange={(e) => handleTextChange(section, "description", e.target.value)}
                                placeholder="Enter meta description snippet"
                                required
                            />
                            <p className="hint">A concise summary of the page to attract search engine clicks.</p>
                        </div>

                        <div className="input-group mb-0">
                            <label>Meta Keywords</label>
                            <input
                                type="text"
                                value={data.keywords}
                                onChange={(e) => handleTextChange(section, "keywords", e.target.value)}
                                placeholder="comma, separated, tags, hallmark"
                            />
                            <p className="hint">Tags to help classify search content (comma separated).</p>
                        </div>
                    </div>

                    <div className="form-section-card mt-4">
                        <h5 className="card-sub-title">Social Sharing Customizations</h5>
                        
                        <div className="input-group">
                            <label>OG Custom Title</label>
                            <input
                                type="text"
                                value={data.ogTitle}
                                onChange={(e) => handleTextChange(section, "ogTitle", e.target.value)}
                                placeholder="Enter custom share card title"
                            />
                            <p className="hint">Overrides the title when shared on platforms like WhatsApp or Facebook.</p>
                        </div>

                        <div className="input-group">
                            <label>OG Custom Description</label>
                            <textarea
                                rows={3}
                                value={data.ogDescription}
                                onChange={(e) => handleTextChange(section, "ogDescription", e.target.value)}
                                placeholder="Enter custom share card description"
                            />
                            <p className="hint">Overrides the description in social share cards.</p>
                        </div>

                        <div className="social-image-upload">
                            <label>OG Share Image Override</label>
                            <div className="og-image-box" onClick={() => triggerImageUpload(section)}>
                                {imagePreviews[section] ? (
                                    <>
                                        <img src={imagePreviews[section]} alt="OG Share Preview" />
                                        <div className="og-image-overlay">
                                            <i className="bi bi-camera"></i> Change Image
                                        </div>
                                    </>
                                ) : (
                                    <div className="placeholder">
                                        <i className="bi bi-cloud-arrow-up"></i>
                                        <span>Click to Upload Share Image</span>
                                    </div>
                                )}
                            </div>
                            <p className="hint mt-2">Recommended: 1200 x 630 pixels. JPEG, PNG, WebP.</p>
                        </div>
                    </div>
                </div>

                <div className="seo-previews-sidebar">
                    {renderPreviews(section)}
                </div>
            </div>
        );
    };

    return (
        <div className="seo-setup-wrapper">
            {ToastComponent}
            
            {/* Hidden Single File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="seo-setup-layout">
                {/* Left Sidebar Menu */}
                <aside className="seo-settings-sidebar">
                    <div className="sidebar-group">
                        <span className="group-label">Global Configuration</span>
                        
                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "global" ? "active" : ""}`}
                            onClick={() => setActiveTab("global")}
                        >
                            <div className="tab-icon"><i className="bi bi-globe-americas"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Global Defaults</span>
                                <span className="tab-desc">Fallback settings for all pages</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-group mt-4">
                        <span className="group-label">Core Pages</span>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "home" ? "active" : ""}`}
                            onClick={() => setActiveTab("home")}
                        >
                            <div className="tab-icon"><i className="bi bi-house-door-fill"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Home Page SEO</span>
                                <span className="tab-desc">Metadata for homepage (/)</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "shop" ? "active" : ""}`}
                            onClick={() => setActiveTab("shop")}
                        >
                            <div className="tab-icon"><i className="bi bi-cart-fill"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Shop Page SEO</span>
                                <span className="tab-desc">Metadata for (/shop)</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-group mt-4">
                        <span className="group-label">Distributor Portal</span>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "b2b" ? "active" : ""}`}
                            onClick={() => setActiveTab("b2b")}
                        >
                            <div className="tab-icon"><i className="bi bi-building-fill-gear"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">B2B Login</span>
                                <span className="tab-desc">Metadata for B2B login page</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "b2bAccount" ? "active" : ""}`}
                            onClick={() => setActiveTab("b2bAccount")}
                        >
                            <div className="tab-icon"><i className="bi bi-person-badge-fill"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">B2B My Account</span>
                                <span className="tab-desc">Metadata for (/b2b/account)</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-group mt-4">
                        <span className="group-label">Shopping Checkout Flow</span>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "cart" ? "active" : ""}`}
                            onClick={() => setActiveTab("cart")}
                        >
                            <div className="tab-icon"><i className="bi bi-basket3-fill"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Shopping Cart</span>
                                <span className="tab-desc">Metadata for (/cart)</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "checkout" ? "active" : ""}`}
                            onClick={() => setActiveTab("checkout")}
                        >
                            <div className="tab-icon"><i className="bi bi-credit-card-2-back-fill"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Checkout Page</span>
                                <span className="tab-desc">Metadata for (/checkout)</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "orderSuccess" ? "active" : ""}`}
                            onClick={() => setActiveTab("orderSuccess")}
                        >
                            <div className="tab-icon"><i className="bi bi-shield-fill-check"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Order Confirmation</span>
                                <span className="tab-desc">Metadata for (/order-success)</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-group mt-4">
                        <span className="group-label">General Content Pages</span>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "portfolioDetails" ? "active" : ""}`}
                            onClick={() => setActiveTab("portfolioDetails")}
                        >
                            <div className="tab-icon"><i className="bi bi-journal-album"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Portfolio Details</span>
                                <span className="tab-desc">(/portfolio-details) overrides</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "productDetails" ? "active" : ""}`}
                            onClick={() => setActiveTab("productDetails")}
                        >
                            <div className="tab-icon"><i className="bi bi-info-circle-fill"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Product Static Details</span>
                                <span className="tab-desc">(/product-details) overrides</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-group mt-4">
                        <span className="group-label">Integrations</span>
                        
                        <button
                            type="button"
                            className={`sidebar-tab-btn ${activeTab === "scripts" ? "active" : ""}`}
                            onClick={() => setActiveTab("scripts")}
                        >
                            <div className="tab-icon"><i className="bi bi-code-slash"></i></div>
                            <div className="tab-content">
                                <span className="tab-title">Scripts & Analytics</span>
                                <span className="tab-desc">GA4, Pixel & custom codes</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-action-sticky">
                        <button type="button" className="action-save-btn" onClick={handleSubmit} disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-sm"></span> Saving...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-save2-fill"></i> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Right Form Content */}
                <main className="seo-settings-content">
                    <form onSubmit={handleSubmit} className="seo-form">
                        {activeTab === "global" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Global Default SEO Configuration</h3>
                                    <p>Configure fallback metadata tags. If a specific page has no overrides configured, Google and social platforms will read these settings.</p>
                                </div>
                                {renderSeoInputs("default")}
                            </div>
                        )}

                        {activeTab === "home" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Home Page SEO Customization</h3>
                                    <p>Configure specific SEO meta tags for the main homepage landing view (/).</p>
                                </div>
                                {renderSeoInputs("home")}
                            </div>
                        )}

                        {activeTab === "shop" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Shop Online Page SEO Customization</h3>
                                    <p>Configure specific SEO metadata for the e-commerce catalog page (/shop).</p>
                                </div>
                                {renderSeoInputs("shop")}
                            </div>
                        )}

                        {activeTab === "b2b" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>B2B Portal Page SEO Customization</h3>
                                    <p>Configure specific SEO metadata for the B2B distributor portal (/b2b/login).</p>
                                </div>
                                {renderSeoInputs("b2b")}
                            </div>
                        )}

                        {activeTab === "b2bAccount" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>B2B Account Page SEO Customization</h3>
                                    <p>Configure specific SEO metadata for the B2B logged-in distributor account page (/b2b/account).</p>
                                </div>
                                {renderSeoInputs("b2bAccount")}
                            </div>
                        )}

                        {activeTab === "cart" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Shopping Cart SEO Customization</h3>
                                    <p>Configure SEO tags for the customer shopping cart page (/cart).</p>
                                </div>
                                {renderSeoInputs("cart")}
                            </div>
                        )}

                        {activeTab === "checkout" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Checkout Page SEO Customization</h3>
                                    <p>Configure SEO tags for the secure checkout submission page (/checkout).</p>
                                </div>
                                {renderSeoInputs("checkout")}
                            </div>
                        )}

                        {activeTab === "orderSuccess" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Order Confirmation Page SEO Customization</h3>
                                    <p>Configure SEO tags for the post-checkout order success screen (/order-success).</p>
                                </div>
                                {renderSeoInputs("orderSuccess")}
                            </div>
                        )}

                        {activeTab === "portfolioDetails" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Portfolio Details SEO Customization</h3>
                                    <p>Configure metadata for the main portfolio showreel/gallery detailed view (/portfolio-details).</p>
                                </div>
                                {renderSeoInputs("portfolioDetails")}
                            </div>
                        )}

                        {activeTab === "productDetails" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Product Static Details SEO Customization</h3>
                                    <p>Configure metadata for the static dishwash display details showcase page (/product-details).</p>
                                </div>
                                {renderSeoInputs("productDetails")}
                            </div>
                        )}

                        {activeTab === "scripts" && (
                            <div className="tab-pane-content">
                                <div className="pane-header">
                                    <h3>Tracking Pixels & Header Script Injectors</h3>
                                    <p>Embed external trackers, conversion pixels, site verifications, and custom JavaScript codes directly into Hallmark pages.</p>
                                </div>

                                <div className="integrations-layout">
                                    <div className="integrations-form">
                                        <div className="form-section-card">
                                            <h5 className="card-sub-title"><i className="bi bi-bar-chart-line-fill text-success"></i> Web Analytics Integration</h5>
                                            <div className="grid-2">
                                                <div className="input-group">
                                                    <label>Google Analytics ID (GA4)</label>
                                                    <input
                                                        type="text"
                                                        value={formData.googleAnalyticsId}
                                                        onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                                                        placeholder="G-XXXXXXXXXX"
                                                    />
                                                    <p className="hint">E.g., G-2L8P3T9Y5B. Disables tracking if empty.</p>
                                                </div>
                                                <div className="input-group">
                                                    <label>Facebook Pixel ID</label>
                                                    <input
                                                        type="text"
                                                        value={formData.facebookPixelId}
                                                        onChange={(e) => setFormData({ ...formData, facebookPixelId: e.target.value })}
                                                        placeholder="15-digit Pixel ID"
                                                    />
                                                    <p className="hint">E.g., 2384950284710293. Embeds Meta track events.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-section-card mt-4">
                                            <h5 className="card-sub-title"><i className="bi bi-braces text-primary"></i> Head Injection Snippet</h5>
                                            <div className="input-group mb-0">
                                                <label>Custom HTML inside &lt;head&gt; element</label>
                                                <textarea
                                                    rows={8}
                                                    className="code-editor"
                                                    value={formData.customHeadScript}
                                                    onChange={(e) => setFormData({ ...formData, customHeadScript: e.target.value })}
                                                    placeholder="<!-- Add site verification metas, custom css stylesheets, webfonts, etc. -->"
                                                />
                                                <p className="hint">Injected inside document &lt;head&gt;. Use carefully to avoid template rendering issues.</p>
                                            </div>
                                        </div>

                                        <div className="form-section-card mt-4">
                                            <h5 className="card-sub-title"><i className="bi bi-braces-asterisk text-warning"></i> Footer Injection Snippet</h5>
                                            <div className="input-group mb-0">
                                                <label>Custom HTML just before closing &lt;/body&gt; tag</label>
                                                <textarea
                                                    rows={8}
                                                    className="code-editor"
                                                    value={formData.customBodyScript}
                                                    onChange={(e) => setFormData({ ...formData, customBodyScript: e.target.value })}
                                                    placeholder="<!-- Insert feedback chats, live support widgets, heatmaps, tracking scripts, etc. -->"
                                                />
                                                <p className="hint">Ideal for live chat systems (e.g. Zendesk, Crisp) and widgets that shouldn't block initial page rendering.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .seo-setup-wrapper {
                    width: 100%;
                    padding: 0;
                    margin: 0;
                    box-sizing: border-box;
                }
                .seo-setup-wrapper * {
                    box-sizing: border-box;
                }

                .seo-setup-layout {
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    gap: 2rem;
                    align-items: start;
                }

                /* Left Settings Sidebar Navigation */
                .seo-settings-sidebar {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 1.5rem;
                    position: sticky;
                    top: 100px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    max-height: calc(100vh - 120px);
                    overflow-y: auto;
                    scrollbar-width: thin;
                }

                .sidebar-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .group-label {
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #94a3b8;
                    letter-spacing: 0.05em;
                    padding: 0 8px 8px 8px;
                    border-bottom: 1px solid #f1f5f9;
                    margin-bottom: 4px;
                    display: block;
                }

                .sidebar-tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s ease;
                    width: 100%;
                }

                .sidebar-tab-btn:hover {
                    background: #f8fafc;
                    border-color: #e2e8f0;
                }

                .sidebar-tab-btn.active {
                    background: #fff8eb;
                    border-color: #ffe8cc;
                }

                .tab-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: #f1f5f9;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                }

                .sidebar-tab-btn.active .tab-icon {
                    background: #ffc451;
                    color: #ffffff;
                }

                .tab-content {
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .tab-title {
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: #1e293b;
                }

                .tab-desc {
                    font-size: 0.72rem;
                    color: #64748b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .sidebar-action-sticky {
                    margin-top: 1.5rem;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 1.25rem;
                    position: sticky;
                    bottom: 0;
                    background: #ffffff;
                    z-index: 10;
                }

                .action-save-btn {
                    width: 100%;
                    padding: 14px;
                    background: #ffc451;
                    color: #ffffff;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-size: 0.95rem;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(255, 196, 81, 0.15);
                }

                .action-save-btn:hover:not(:disabled) {
                    background: #f8b42d;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(255, 196, 81, 0.25);
                }

                .action-save-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                /* Right Settings Content Form */
                .seo-settings-content {
                    width: 100%;
                }

                .tab-pane-content {
                    animation: fadeIn 0.35s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .pane-header {
                    margin-bottom: 2rem;
                }

                .pane-header h3 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 0.5rem;
                    margin-top: 0;
                }

                .pane-header p {
                    color: #64748b;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin: 0;
                }

                /* SEO Form Grid Layout */
                .seo-grid {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 2rem;
                    align-items: start;
                }

                .form-section-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 2rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    display: block;
                }

                .card-sub-title {
                    font-size: 1.05rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-top: 0;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .input-group {
                    margin-bottom: 1.5rem;
                    display: flex;
                    flex-direction: column;
                }

                .mb-0 { margin-bottom: 0 !important; }

                .label-with-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }

                .label-with-meta label, .input-group label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #475569;
                    margin-bottom: 0;
                    display: inline-block;
                }

                .length-indicator {
                    font-size: 0.72rem;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 6px;
                    display: inline-block;
                }

                .length-indicator.valid {
                    background: #f0fdf4;
                    color: #166534;
                }

                .length-indicator.warning {
                    background: #fffbeb;
                    color: #854d0e;
                }

                .input-group input, .input-group textarea {
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1px solid #cbd5e1;
                    font-size: 0.95rem;
                    background: #f8fafc;
                    transition: all 0.2s ease;
                    color: #0f172a;
                    width: 100%;
                    display: block;
                }

                .input-group input:focus, .input-group textarea:focus {
                    outline: none;
                    border-color: #ffc451;
                    box-shadow: 0 0 0 4px rgba(255,196,81,0.15);
                    background: #ffffff;
                }

                .code-editor {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.85rem;
                    background: #0f172a !important;
                    color: #38bdf8 !important;
                    line-height: 1.6;
                }

                .code-editor:focus {
                    border-color: #38bdf8 !important;
                    box-shadow: 0 0 0 4px rgba(56,189,248,0.15) !important;
                }

                .hint {
                    font-size: 0.78rem;
                    color: #94a3b8;
                    margin-top: 6px;
                    line-height: 1.4;
                    display: block;
                }

                /* OpenGraph Image Upload Box */
                .social-image-upload {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-direction: column;
                }

                .social-image-upload label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #475569;
                    margin-bottom: 0.5rem;
                }

                .og-image-box {
                    border: 2px dashed #cbd5e1;
                    border-radius: 16px;
                    height: 180px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    overflow: hidden;
                    background: #f8fafc;
                    position: relative;
                    transition: all 0.2s ease;
                }

                .og-image-box:hover {
                    border-color: #ffc451;
                    background: #ffffff;
                }

                .og-image-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .og-image-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.6);
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .og-image-box:hover .og-image-overlay {
                    opacity: 1;
                }

                .placeholder {
                    text-align: center;
                    color: #94a3b8;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }

                .placeholder i {
                    font-size: 2.25rem;
                }

                .placeholder span {
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                /* Right Previews Area */
                .seo-previews-sidebar {
                    position: sticky;
                    top: 100px;
                }

                .preview-section {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 24px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }

                .preview-section-title {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin-bottom: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 8px;
                    margin-top: 0;
                }

                .preview-card {
                    margin-bottom: 1.5rem;
                }

                .preview-card:last-child {
                    margin-bottom: 0;
                }

                .preview-label {
                    display: block;
                    font-size: 0.72rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #94a3b8;
                    margin-bottom: 8px;
                    letter-spacing: 0.05em;
                }

                /* Google Snippet Details */
                .google-preview {
                    background: #ffffff;
                    border: 1px solid #f1f5f9;
                    border-radius: 12px;
                    padding: 12px;
                    font-family: Arial, sans-serif;
                }

                .google-url-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 4px;
                }

                .google-favicon {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 0.55rem;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .google-url {
                    font-size: 0.75rem;
                    color: #202124;
                }

                .google-title {
                    font-size: 1.15rem;
                    color: #1a0dab;
                    line-height: 1.3;
                    margin-bottom: 4px;
                    cursor: pointer;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .google-title:hover {
                    text-decoration: underline;
                }

                .google-desc {
                    font-size: 0.85rem;
                    color: #4d5156;
                    line-height: 1.5;
                    word-wrap: break-word;
                }

                /* Social preview details */
                .social-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #f8fafc;
                }

                .social-img-wrap {
                    height: 160px;
                    overflow: hidden;
                    background: #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .social-img-wrap img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .social-meta {
                    padding: 12px;
                }

                .social-domain {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }

                .social-title {
                    font-size: 0.88rem;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.3;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .social-desc {
                    font-size: 0.75rem;
                    color: #64748b;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Integrations and scripts layouts */
                .integrations-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .integrations-form {
                    width: 100%;
                }

                .spinner-sm {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ffffff;
                    border-top: 2px solid transparent;
                    border-radius: 50%;
                    display: inline-block;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .hidden { display: none; }
                .mt-2 { margin-top: 0.5rem; }
                .mt-4 { margin-top: 1.5rem; }

                /* Responsiveness stack */
                @media (max-width: 1200px) {
                    .seo-grid {
                        grid-template-columns: 1fr;
                    }
                    .seo-previews-sidebar {
                        position: static;
                    }
                }

                @media (max-width: 992px) {
                    .seo-setup-layout {
                        grid-template-columns: 1fr;
                    }
                    .seo-settings-sidebar {
                        position: static;
                        max-height: none;
                    }
                }
            ` }} />
        </div>
    );
}
