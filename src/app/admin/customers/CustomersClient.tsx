"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Customer } from "./actions";

interface CustomersClientProps {
    initialCustomers: Customer[];
}

export default function CustomersClient({ initialCustomers }: CustomersClientProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCustomers = initialCustomers.filter(customer =>
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="customers-container">
            <div className="customers-header">
                <div className="header-info">
                    <h3>Customers</h3>
                    <p>View and manage your registered customer database.</p>
                </div>
            </div>

            <div className="table-card">
                <div className="table-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search by Name, Email or Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="customers-table desktop-only-table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Contact Info</th>
                                <th>Location</th>
                                <th>Last Order Update</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="no-results">No customers found.</td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="customer-name-cell">
                                                <div className="avatar-small">
                                                    {(customer.firstName?.[0] || customer.email?.[0] || "-").toUpperCase()}
                                                    {customer.lastName?.[0]?.toUpperCase() || ""}
                                                </div>
                                                <div className="d-flex flex-column align-items-start gap-1">
                                                    <span className="customer-name">
                                                        {customer.firstName || customer.lastName ? `${customer.firstName} ${customer.lastName}`.trim() : "No Name Provided"}
                                                    </span>
                                                    {customer.subscribed && (
                                                        <span className="badge bg-success" style={{ fontSize: '0.65rem' }}>Subscribed</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                <span className="email">
                                                    <i className="bi bi-envelope"></i> {customer.email}
                                                </span>
                                                <span className="phone"><i className="bi bi-telephone"></i> {customer.phone || "—"}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="location-info">
                                                <span className="city">{customer.city || "—"}</span>
                                                <span className="address-snippet" title={customer.address}>
                                                    {customer.address ? (customer.address.length > 30 ? customer.address.substring(0, 30) + "..." : customer.address) : "—"}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="update-date">
                                                {customer.updatedAt ? format(new Date(customer.updatedAt), "MMM dd, yyyy") : "—"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button
                                                    type="button"
                                                    className="icon-btn history"
                                                    title="View Profile & History"
                                                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                                                >
                                                    <i className="bi bi-person-badge"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="customer-cards mobile-only-cards">
                        {filteredCustomers.length === 0 ? (
                            <div className="no-results">No customers found.</div>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <div className="customer-card" key={customer.id}>
                                    <div className="card-header">
                                        <div className="card-avatar">
                                            {(customer.firstName?.[0] || customer.email?.[0] || "-").toUpperCase()}
                                            {customer.lastName?.[0]?.toUpperCase() || ""}
                                        </div>
                                        <div className="card-title-group">
                                            <div className="card-name">{customer.firstName || customer.lastName ? `${customer.firstName} ${customer.lastName}`.trim() : "No Name Provided"}</div>
                                            {customer.subscribed && <div className="mb-1"><span className="badge bg-success" style={{ fontSize: '0.65rem' }}>Subscribed</span></div>}
                                            <div className="card-update">Updated: {customer.updatedAt ? format(new Date(customer.updatedAt), "MMM dd, yyyy") : "—"}</div>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="card-info-item">
                                            <i className="bi bi-envelope"></i>
                                            <span>{customer.email}</span>
                                        </div>
                                        <div className="card-info-item">
                                            <i className="bi bi-telephone"></i>
                                            <span>{customer.phone || "—"}</span>
                                        </div>
                                        <div className="card-info-item location">
                                            <i className="bi bi-geo-alt"></i>
                                            <div className="location-details">
                                                <div className="card-city">{customer.city || "—"}</div>
                                                <div className="card-address">{customer.address || "No address provided"}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-footer-custom">
                                        <Link className="mobile-action-btn-custom history" href={`/admin/customers/${customer.id}`}>
                                            <i className="bi bi-person-badge"></i> View Profile
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>


            <style jsx>{`
                .customers-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                .customers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }

                .table-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .table-actions { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
                .search-box { position: relative; max-width: 400px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; }
                .search-box input:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); }

                .customers-table { width: 100%; border-collapse: collapse; text-align: left; }
                .customers-table th { padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
                .customers-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                
                .customer-name-cell { display: flex; align-items: center; gap: 0.75rem; }
                .avatar-small { width: 32px; height: 32px; border-radius: 8px; background: #fff8eb; color: #ffc451; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; border: 1px solid #fff2d9; text-transform: uppercase; }
                .customer-name { font-weight: 700; color: #0f172a; }

                .contact-info { display: flex; flex-direction: column; gap: 0.25rem; }
                .contact-info span { font-size: 0.8125rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem; }
                .contact-info i { color: #94a3b8; font-size: 0.875rem; }

                .location-info { display: flex; flex-direction: column; gap: 0.25rem; }
                .city { font-weight: 600; color: #0f172a; font-size: 0.875rem; }
                .address-snippet { font-size: 0.75rem; color: #94a3b8; }

                .update-date { font-size: 0.875rem; color: #64748b; font-weight: 500; }
                
                .action-btns { display: flex; gap: 0.5rem; }
                .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: 1px solid transparent; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
                .icon-btn.history { background: #f8fafc; color: #7c3aed; }
                .icon-btn:hover { background: #ffc451; color: #fff !important; transform: translateY(-2px); }

                /* Modal Overlay Standard */
                .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); z-index: 12000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.3s ease; }
                .modal-content { background: #fff; padding: 2.5rem; border-radius: 28px; width: 100%; max-width: 460px; box-shadow: 0 30px 60px -12px rgba(0,0,0,0.25); position: relative; border: 1px solid #f1f5f9; }

                /* History Modal Detail Styles */
                .history-modal { max-width: 500px !important; padding: 0 !important; overflow: hidden; }
                .history-modal-header { padding: 2rem; display: flex; align-items: center; gap: 1.25rem; border-bottom: 1px solid #f1f5f9; background: #fafafa; position: relative; }
                .history-modal-header i.bi-clock-history { font-size: 2.5rem; color: #db2777; background: #fdf2f8; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 18px; }
                .history-modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 800; }
                .history-modal-header p { margin: 0; color: #64748b; font-size: 0.85rem; font-weight: 600; }
                .close-x { position: absolute; top: 1.5rem; right: 1.5rem; border: none; background: #f1f5f9; color: #94a3b8; width: 32px; height: 32px; border-radius: 10px; cursor: pointer; transition: 0.2s; }
                .close-x:hover { background: #fee2e2; color: #ef4444; }

                .history-options { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .history-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem; border-radius: 20px; border: 2px solid #f1f5f9; text-decoration: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                .history-card:hover { border-color: #ffc451; background: #fffbeb; transform: translateY(-3px); box-shadow: 0 10px 20px rgba(255, 196, 81, 0.1); }
                
                .card-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
                .card-icon.orders { background: #eff6ff; color: #3b82f6; }
                .card-icon.rewards { background: #fefce8; color: #ca8a04; }
                
                .card-info { flex: 1; }
                .card-info h4 { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
                .card-info p { margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 500; }
                .arrow { color: #cbd5e1; transition: 0.3s; }
                .history-card:hover .arrow { color: #ffc451; transform: translateX(5px); }

                .no-results { padding: 3rem; text-align: center; color: #94a3b8; font-style: italic; }

                .table-responsive { overflow-x: auto; }
                .mobile-only-cards { display: none; }

                @media (max-width: 768px) {
                    .customers-header { margin-bottom: 1.5rem; }
                    .header-info h3 { font-size: 1.25rem; }
                    .header-info p { font-size: 0.875rem; }
                    .table-actions { padding: 1rem; }
                    
                    .desktop-only-table { display: none; }
                    .mobile-only-cards { display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem; background: #fafbfc; }
                    
                    .customer-card { background: #fff; border-radius: 16px; padding: 1.25rem; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                    .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px dashed #e2e8f0; }
                    .card-avatar { width: 44px; height: 44px; border-radius: 12px; background: #fff8eb; color: #ffc451; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 800; border: 1px solid #fff2d9; text-transform: uppercase; }
                    .card-name { font-size: 1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.15rem; }
                    .card-update { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                    
                    .card-body { display: flex; flex-direction: column; gap: 1rem; }
                    .card-info-item { display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.875rem; color: #475569; font-weight: 500; }
                    .card-info-item i { color: #94a3b8; font-size: 1rem; margin-top: 0.1rem; }
                    .card-info-item.location { align-items: flex-start; }
                    .location-details { display: flex; flex-direction: column; gap: 0.2rem; }
                    .card-city { font-weight: 700; color: #1e293b; }
                    .card-address { font-size: 0.8125rem; color: #64748b; line-height: 1.4; }

                    .card-footer-custom { padding-top: 1rem; border-top: 1px dashed #e2e8f0; margin-top: 1rem; }
                    .mobile-action-btn-custom { width: 100%; height: 44px; border-radius: 12px; border: none; background: #f0fdfa; color: #0d9488; font-weight: 800; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: 0.2s; text-decoration: none; }
                    .mobile-action-btn-custom:active { transform: scale(0.95); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}
