"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    addMonths, 
    subMonths 
} from "date-fns";
import { addManualPoints, getB2BClients } from "./actions";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

interface RewardTransaction {
    id: string;
    type: 'Earned' | 'Used' | 'Redeemed';
    amount: number;
    orderNo: string;
    b2bClientCompany: string;
    createdAt: string;
    status?: string;
    isManual?: boolean;
    invoiceDate?: string;
    invoiceAmount?: number | string;
}

export default function RewardsClient({ initialTransactions }: { initialTransactions: RewardTransaction[] }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Manual Points Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState("");
    const [clientSearchTerm, setClientSearchTerm] = useState("");
    const [showClientList, setShowClientList] = useState(false);
    const [invoiceAmountInput, setInvoiceAmountInput] = useState("");
    const [pointsAmount, setPointsAmount] = useState("");
    const [invoiceNo, setInvoiceNo] = useState("");
    const [invoiceDate, setInvoiceDate] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [fetchingClients, setFetchingClients] = useState(false);
    
    // Auto-calculate points when amount or client changes
    useEffect(() => {
        if (selectedClient && invoiceAmountInput) {
            const client = clients.find(c => c.id === selectedClient);
            if (client) {
                const percentage = client.rewardPercentage || 2;
                const amt = parseFloat(invoiceAmountInput);
                if (!isNaN(amt)) {
                    const calculatedPoints = (amt * percentage) / 100;
                    setPointsAmount(calculatedPoints.toFixed(2));
                }
            }
        }
    }, [selectedClient, invoiceAmountInput, clients]);

    // Calendar State
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        if (!showCalendar) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.calendar-picker-container')) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCalendar]);

    const generateDays = () => {
        const start = startOfMonth(viewDate);
        const end = endOfMonth(viewDate);
        const days = eachDayOfInterval({
            start: startOfWeek(start),
            end: endOfWeek(end),
        });
        return days;
    };

    const handleDateSelect = (date: Date) => {
        setInvoiceDate(format(date, "yyyy-MM-dd"));
        setShowCalendar(false);
    };

    const nextMonth = () => setViewDate(prev => addMonths(prev, 1));
    const prevMonth = () => setViewDate(prev => subMonths(prev, 1));

    useEffect(() => {
        if (showAddModal && clients.length === 0) {
            setFetchingClients(true);
            getB2BClients().then(res => {
                setClients(res);
                setFetchingClients(false);
            });
        }
    }, [showAddModal, clients.length]);

    useEffect(() => {
        const urlSearch = new URLSearchParams(window.location.search).get("search");
        if (urlSearch) {
            setSearchTerm(urlSearch);
        }
    }, []);

    const handleAddPoints = async () => {
        if (!selectedClient || !pointsAmount) {
            alert("Please select a client and enter points amount.");
            return;
        }

        const amt = parseFloat(pointsAmount);
        if (isNaN(amt) || amt === 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setSubmitting(true);
        const invAmt = parseFloat(invoiceAmountInput) || 0;
        const res = await addManualPoints(selectedClient, amt, invoiceNo || "Internal Adjustment", invoiceDate, invAmt);
        setSubmitting(false);
        
        if (res.success) {
            setShowAddModal(false);
            setSelectedClient("");
            setInvoiceAmountInput("");
            setPointsAmount("");
            setInvoiceNo("");
            setInvoiceDate("");
            router.refresh();
        } else {
            alert(res.error || "Failed to add points.");
        }
    };

    const filteredTransactions = initialTransactions.filter(t => 
        t.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.b2bClientCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + PAGE_SIZE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const exportToCSV = () => {
        const headers = ["Date", "Time", "Reference", "Invoice Date", "B2B Client", "Type", "Invoice Amount", "Points", "Status"];
        const rows = filteredTransactions.map(tx => [
            format(new Date(tx.createdAt), 'yyyy-MM-dd'),
            format(new Date(tx.createdAt), 'hh:mm a'),
            tx.orderNo.replace(/"/g, '""'),
            tx.invoiceDate || "",
            tx.b2bClientCompany.replace(/"/g, '""'),
            tx.type,
            tx.invoiceAmount || 0,
            tx.amount,
            tx.status || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(val => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `reward_history_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case "Pending": return "status-warning";
            case "Approved": return "status-info";
            case "Completed": return "status-success";
            case "Rejected": return "status-danger";
            default: return "status-pending";
        }
    };

    return (
        <div className="rewards-container">
            <div className="rewards-header">
                <div className="header-info">
                    <h3>Reward History</h3>
                    <p>Track all reward point transactions, including earnings and redemptions.</p>
                </div>
                <div className="header-actions">
                    <button 
                        className="export-btn"
                        onClick={exportToCSV}
                        title="Export filtered history to CSV"
                    >
                        <i className="bi bi-download"></i>
                        <span>Export Data</span>
                    </button>
                    <button 
                        className="add-points-btn"
                        onClick={() => setShowAddModal(true)}
                    >
                        <i className="bi bi-plus-lg"></i>
                        <span>Add Points Manual</span>
                    </button>
                </div>
            </div>

            <div className="table-card">
                <div className="table-actions">
                    <div className="search-box">
                        <i className="bi bi-search"></i>
                        <input
                            type="text"
                            placeholder="Search Order, Client, or Type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive d-none d-md-block">
                    <table className="rewards-table">
                        <thead>
                            <tr>
                                <th style={{ width: '120px' }}>Date</th>
                                <th style={{ width: '150px' }}>Reference</th>
                                <th style={{ width: '200px' }}>B2B Client</th>
                                <th style={{ width: '120px' }}>Type</th>
                                <th style={{ width: '120px' }}>Invoice Amt</th>
                                <th style={{ width: '120px' }}>Points</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="no-results">No reward transactions found.</td>
                                </tr>
                            ) : (
                                paginatedTransactions.map((tx) => (
                                    <tr key={tx.id} className="reward-row">
                                        <td>
                                            <div className="date-cell">
                                                <span className="main-date">{format(new Date(tx.createdAt), 'MMM dd, yyyy')}</span>
                                                <span className="sub-time">{format(new Date(tx.createdAt), 'hh:mm a')}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="ref-cell">
                                                <span className="order-no">{tx.orderNo}</span>
                                                {tx.invoiceDate && (
                                                    <span className="invoice-date-sub">{format(new Date(tx.invoiceDate), 'MMM dd, yyyy')}</span>
                                                )}
                                                {tx.status && (
                                                    <span className={`status-badge ${getStatusClass(tx.status)}`}>
                                                        {tx.status}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="client-name">{tx.b2bClientCompany}</span>
                                        </td>
                                        <td>
                                            <span className={`type-pill ${tx.type.toLowerCase()}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="amount-val">
                                                {tx.invoiceAmount ? (
                                                    typeof tx.invoiceAmount === 'string' ? (tx.invoiceAmount.startsWith('₹') ? tx.invoiceAmount : `₹${tx.invoiceAmount}`) : `₹${tx.invoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                                ) : "-"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`amount-val ${tx.type === 'Earned' ? 'earned' : 'used'}`}>
                                                {tx.type === 'Earned' ? '+' : '-'}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td>
                                            {(tx.type === 'Earned' || tx.type === 'Used') && !tx.isManual ? (
                                                <Link 
                                                    href={`/admin/orders/${tx.id.replace('_used', '')}`} 
                                                    className="view-btn"
                                                >
                                                    <i className="bi bi-eye"></i> View Order
                                                </Link>
                                            ) : (
                                                <span className="no-action-label">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="rewards-cards-mobile d-md-none">
                    {paginatedTransactions.length === 0 ? (
                        <div className="no-results">No reward transactions found.</div>
                    ) : (
                        paginatedTransactions.map((tx) => (
                            <div key={tx.id} className="reward-mobile-card">
                                <div className="card-header-tx">
                                    <div className="tx-date-wrap">
                                        <span className="tx-d">{format(new Date(tx.createdAt), 'MMM dd, yyyy')}</span>
                                        <span className="tx-t">{format(new Date(tx.createdAt), 'hh:mm a')}</span>
                                    </div>
                                    <span className={`type-pill ${tx.type.toLowerCase()}`}>{tx.type}</span>
                                </div>
                                <div className="card-body-tx">
                                    <div className="tx-row">
                                        <span className="tx-label">Reference</span>
                                        <div className="tx-val-group">
                                            <span className="tx-val order-ref">{tx.orderNo}</span>
                                            {tx.invoiceDate && (
                                                <span className="tx-invoice-date">{format(new Date(tx.invoiceDate), 'MMM dd, yyyy')}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="tx-row">
                                        <span className="tx-label">B2B Client</span>
                                        <span className="tx-val client-ref">{tx.b2bClientCompany}</span>
                                    </div>
                                    {tx.status && (
                                        <div className="tx-row">
                                            <span className="tx-label">Status</span>
                                            <span className={`status-badge ${getStatusClass(tx.status)}`}>{tx.status}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer-tx">
                                    <div className="tx-row">
                                        <span className="tx-label">Invoice Amount</span>
                                        <span className="tx-val">
                                            {tx.invoiceAmount ? (
                                                typeof tx.invoiceAmount === 'string' ? (tx.invoiceAmount.startsWith('₹') ? tx.invoiceAmount : `₹${tx.invoiceAmount}`) : `₹${tx.invoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                            ) : "-"}
                                        </span>
                                    </div>
                                    <div className="tx-amount-section">
                                        <span className="tx-label">Points</span>
                                        <span className={`amount-val-mobile ${tx.type === 'Earned' ? 'earned' : 'used'}`}>
                                            {tx.type === 'Earned' ? '+' : '-'}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {(tx.type === 'Earned' || tx.type === 'Used') && !tx.isManual && (
                                        <Link href={`/admin/orders/${tx.id.replace('_used', '')}`} className="mob-view-btn">
                                            <i className="bi bi-eye"></i>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="pagination">
                        <button
                            type="button"
                            className="pager-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i + 1}
                                type="button"
                                className={`pager-btn ${currentPage === i + 1 ? "active" : ""}`}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="pager-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Add Points Modal */}
            {/* Add Points Offcanvas */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => !submitting && setShowAddModal(false)}>
                    <div className="offcanvas-panel-admin" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-admin">
                            <div className="header-title-group">
                                <h4>Add Reward Points</h4>
                                <p>Manually adjust client reward balance</p>
                            </div>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                        <div className="modal-body-admin" onClick={() => setShowClientList(false)}>
                            <div className="form-group-admin">
                                <label>Search & Select B2B Client</label>
                                <div className="searchable-select-container" onClick={e => e.stopPropagation()}>
                                    <div className="search-input-wrapper">
                                        <i className="bi bi-search search-icon"></i>
                                        <input 
                                            type="text"
                                            placeholder="Type company name or username..."
                                            value={clientSearchTerm}
                                            onChange={(e) => {
                                                setClientSearchTerm(e.target.value);
                                                setShowClientList(true);
                                            }}
                                            onFocus={() => setShowClientList(true)}
                                            disabled={fetchingClients || submitting}
                                            className="search-input-fancy"
                                        />
                                        {(selectedClient || clientSearchTerm) && (
                                            <button 
                                                className="clear-selection" 
                                                onClick={() => {
                                                    setSelectedClient("");
                                                    setClientSearchTerm("");
                                                    setShowClientList(true);
                                                }}
                                            >
                                                <i className="bi bi-x-circle-fill"></i>
                                            </button>
                                        )}
                                    </div>
                                    
                                    {showClientList && (
                                        <div className="client-dropdown-list shadow-lg">
                                            {fetchingClients ? (
                                                <div className="list-item loading">
                                                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                                    Loading clients...
                                                </div>
                                            ) : (
                                                <div className="list-scroll">
                                                    {clients
                                                        .filter(c => 
                                                            c.companyName?.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
                                                            c.username?.toLowerCase().includes(clientSearchTerm.toLowerCase())
                                                        )
                                                        .map(c => (
                                                            <div 
                                                                key={c.id} 
                                                                className={`list-item-fancy ${selectedClient === c.id ? 'active' : ''}`}
                                                                onClick={() => {
                                                                    setSelectedClient(c.id);
                                                                    setClientSearchTerm(`${c.companyName} (${c.username})`);
                                                                    setShowClientList(false);
                                                                }}
                                                            >
                                                                <div className="item-main">
                                                                    <div className="client-co-fancy">{c.companyName}</div>
                                                                    <div className="client-un-fancy">@{c.username}</div>
                                                                </div>
                                                                {selectedClient === c.id && <i className="bi bi-check2 text-primary"></i>}
                                                            </div>
                                                        ))
                                                    }
                                                    {clients.filter(c => 
                                                        c.companyName?.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
                                                        c.username?.toLowerCase().includes(clientSearchTerm.toLowerCase())
                                                    ).length === 0 && (
                                                        <div className="list-item-fancy empty text-center py-4">
                                                            <i className="bi bi-search text-muted d-block mb-2" style={{ fontSize: '1.5rem' }}></i>
                                                            No clients found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {selectedClient && !showClientList && (
                                    <div className="selected-indicator-fancy">
                                        <i className="bi bi-patch-check-fill"></i>
                                        <span>Client Verified & Selected</span>
                                    </div>
                                )}
                            </div>
                            <div className="form-group-admin">
                                <label>Invoice Amount (₹)</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-prefix">₹</span>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        className="amount-input-fancy"
                                        value={invoiceAmountInput}
                                        onChange={(e) => setInvoiceAmountInput(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>
                                {selectedClient && (
                                    <div className="amount-help">
                                        <i className="bi bi-info-circle"></i>
                                        <span>Client Reward Rate: <strong>{clients.find(c => c.id === selectedClient)?.rewardPercentage || 2}%</strong></span>
                                    </div>
                                )}
                            </div>
                            <div className="form-group-admin">
                                <label>Reward Points</label>
                                <div className="amount-input-wrapper">
                                    <span className="currency-prefix" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>PTS</span>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        className="amount-input-fancy"
                                        style={{ color: '#10b981' }}
                                        value={pointsAmount}
                                        onChange={(e) => setPointsAmount(e.target.value)}
                                        disabled={true}
                                    />
                                </div>
                                <div className="amount-help">
                                    <i className="bi bi-info-circle"></i>
                                    <span>Points to be added to client balance.</span>
                                </div>
                            </div>
                            <div className="form-group-admin">
                                <label>Order / Invoice No</label>
                                <input 
                                    type="text"
                                    placeholder="e.g. INV-2024-001"
                                    className="search-input-fancy"
                                    style={{ paddingLeft: '1rem' }}
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                            <div className="form-group-admin">
                                <label>Invoice Date</label>
                                <div className="calendar-picker-container">
                                    <div 
                                        className={`calendar-trigger-fancy ${showCalendar ? 'active' : ''}`}
                                        onClick={() => setShowCalendar(!showCalendar)}
                                    >
                                        <i className="bi bi-calendar3"></i>
                                        <span>{invoiceDate ? format(new Date(invoiceDate), 'MMM dd, yyyy') : 'Select Date'}</span>
                                        <i className={`bi bi-chevron-${showCalendar ? 'up' : 'down'} ms-auto opacity-50`}></i>
                                    </div>

                                    {showCalendar && (
                                        <div className="premium-calendar-dropdown">
                                            <div className="cal-header">
                                                <button type="button" onClick={prevMonth} className="nav-btn"><i className="bi bi-chevron-left"></i></button>
                                                <span className="month-year">{format(viewDate, "MMMM yyyy")}</span>
                                                <button type="button" onClick={nextMonth} className="nav-btn"><i className="bi bi-chevron-right"></i></button>
                                            </div>
                                            <div className="cal-weekdays">
                                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="wd">{d}</div>)}
                                            </div>
                                            <div className="cal-grid">
                                                {generateDays().map((day, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        className={`cal-day ${!isSameMonth(day, viewDate) ? 'other-month' : ''} ${invoiceDate && isSameDay(day, new Date(invoiceDate)) ? 'selected' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
                                                        onClick={() => handleDateSelect(day)}
                                                    >
                                                        <span className="d-num">{format(day, 'd')}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="cal-footer">
                                                <button 
                                                    type="button" 
                                                    className="today-btn"
                                                    onClick={() => handleDateSelect(new Date())}
                                                >
                                                    Select Today
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-admin-fancy">
                            <button 
                                className="submit-btn-fancy" 
                                onClick={handleAddPoints}
                                disabled={submitting || !selectedClient || !pointsAmount}
                            >
                                {submitting ? (
                                    <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                                ) : (
                                    <><i className="bi bi-plus-circle me-2"></i>Apply Points</>
                                )}
                            </button>
                            <button 
                                className="cancel-btn-fancy" 
                                onClick={() => setShowAddModal(false)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .rewards-container { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                
                .rewards-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-actions { display: flex; gap: 1rem; align-items: center; }
                
                .export-btn {
                    padding: 0.75rem 1.25rem;
                    background: white;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .export-btn:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #0f172a;
                    transform: translateY(-2px);
                }
                .export-btn i { color: #64748b; }

                .add-points-btn {
                    padding: 0.75rem 1.25rem;
                    background: linear-gradient(135deg, #0f172a, #1a1a2e);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
                }
                .add-points-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.25);
                }
                .add-points-btn i { font-size: 1rem; color: #ffc451; }
                
                .header-info h3 { font-size: 1.5rem; margin: 0; color: #0f172a; font-weight: 700; }
                .header-info p { color: #64748b; margin: 0; margin-top: 0.25rem; }

                /* Modal Style */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                }
                .offcanvas-panel-admin {
                    background: white;
                    width: 100%;
                    max-width: 450px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -10px 0 50px rgba(0,0,0,0.15);
                    animation: slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                .modal-header-admin {
                    padding: 2rem;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    background: #fff;
                }
                .header-title-group h4 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
                .header-title-group p { margin: 0; font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }
                .close-btn { background: #f1f5f9; border: none; color: #64748b; font-size: 1rem; cursor: pointer; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .close-btn:hover { background: #fee2e2; color: #ef4444; }

                .modal-body-admin { padding: 2rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2rem; }
                .form-group-admin { display: flex; flex-direction: column; gap: 0.75rem; }
                .form-group-admin label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                
                /* Searchable Select */
                .searchable-select-container { position: relative; }
                .search-input-wrapper { position: relative; width: 100%; }
                .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-input-fancy { width: 100%; padding: 0.875rem 1rem 0.875rem 2.75rem; border-radius: 14px; border: 2px solid #f1f5f9; font-size: 0.95rem; transition: all 0.2s; background: #f8fafc; }
                .search-input-fancy:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.1); }
                .clear-selection { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #cbd5e1; cursor: pointer; font-size: 1.1rem; padding: 0; transition: color 0.2s; }
                .clear-selection:hover { color: #94a3b8; }

                .client-dropdown-list { position: absolute; top: 105%; left: 0; right: 0; background: white; border-radius: 14px; border: 1px solid #f1f5f9; z-index: 100; max-height: 280px; overflow: hidden; display: flex; flex-direction: column; }
                .list-scroll { overflow-y: auto; padding: 0.5rem; }
                .list-item-fancy { padding: 0.75rem 1rem; border-radius: 10px; cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center; }
                .list-item-fancy:hover { background: #f8fafc; }
                .list-item-fancy.active { background: #fffbeb; }
                .client-co-fancy { font-weight: 700; color: #0f172a; font-size: 0.9rem; }
                .client-un-fancy { font-size: 0.75rem; color: #64748b; font-weight: 500; }
                
                .selected-indicator-fancy { display: flex; align-items: center; gap: 0.5rem; color: #10b981; font-size: 0.75rem; font-weight: 700; background: #f0fdf4; padding: 0.5rem 0.75rem; border-radius: 8px; width: fit-content; }

                /* Amount Input */
                .amount-input-wrapper { position: relative; }
                .currency-prefix { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); font-weight: 800; color: #0f172a; font-size: 1.1rem; }
                .amount-input-fancy { width: 100%; padding: 1rem 1rem 1rem 2.5rem; border-radius: 14px; border: 2px solid #f1f5f9; font-size: 1.25rem; font-weight: 800; color: #0f172a; transition: all 0.2s; }
                .amount-input-fancy:focus { outline: none; border-color: #ffc451; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.1); }
                .amount-help { display: flex; align-items: center; gap: 0.4rem; color: #94a3b8; font-size: 0.7rem; font-weight: 500; }

                .textarea-fancy { width: 100%; padding: 1rem; border-radius: 14px; border: 2px solid #f1f5f9; font-family: inherit; font-size: 0.95rem; transition: all 0.2s; resize: none; background: #f8fafc; }
                .textarea-fancy:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.1); }

                .modal-footer-admin-fancy { padding: 1.5rem 2rem 2.5rem; border-top: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 0.75rem; }
                .submit-btn-fancy { padding: 1rem; border-radius: 14px; background: #ffc451; color: #1a1a2e; font-weight: 800; border: none; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
                .submit-btn-fancy:hover:not(:disabled) { background: #f8a623; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(248, 166, 35, 0.3); }
                .submit-btn-fancy:disabled { opacity: 0.5; cursor: not-allowed; }
                .cancel-btn-fancy { padding: 0.75rem; border-radius: 14px; background: transparent; color: #94a3b8; font-weight: 700; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
                .cancel-btn-fancy:hover { background: #f8fafc; color: #64748b; }

                .table-card { background: #fff; border-radius: 20px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .table-actions { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; }
                .search-box { position: relative; max-width: 400px; }
                .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
                .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: inherit; }
                .search-box input:focus { outline: none; border-color: #ffc451; background: #fff; box-shadow: 0 0 0 4px rgba(255, 196, 81, 0.1); }

                .rewards-table { width: 100%; border-collapse: collapse; text-align: left; }
                .rewards-table th { padding: 1.25rem 1.5rem; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; }
                .rewards-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                
                .date-cell { display: flex; flex-direction: column; }
                .main-date { font-weight: 700; color: #0f172a; font-size: 0.9rem; }
                .sub-time { color: #94a3b8; font-size: 0.75rem; }

                .ref-cell { display: flex; flex-direction: column; gap: 0.2rem; }
                .order-no { font-weight: 700; color: #ffc451; font-size: 0.9rem; }
                .invoice-date-sub { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }

                .client-name { font-weight: 600; color: #475569; }

                .type-pill { padding: 0.35rem 0.75rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .type-pill.earned { background: #dcfce7; color: #166534; }
                .type-pill.used { background: #fef2f2; color: #991b1b; }
                .type-pill.redeemed { background: #f0f9ff; color: #0369a1; }

                .amount-val { font-weight: 800; font-size: 1rem; }
                .amount-val.earned { color: #166534; }
                .amount-val.used { color: #991b1b; }

                .status-badge { padding: 0.25rem 0.6rem; border-radius: 8px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
                .status-warning { background: #fffbeb; color: #92400e; }
                .status-info { background: #f0f9ff; color: #0369a1; }
                .status-success { background: #f0fdf4; color: #166534; }
                .status-danger { background: #fef2f2; color: #991b1b; }
                .status-pending { background: #f8fafc; color: #64748b; }

                .view-btn { padding: 0.5rem 1rem; background: #f8fafc; color: #0f172a; border-radius: 10px; font-size: 0.8rem; font-weight: 700; text-decoration: none; border: 1px solid #e2e8f0; transition: 0.2s; display: inline-flex; align-items: center; gap: 0.4rem; }
                .view-btn:hover { background: #ffc451; color: #fff; border-color: #ffc451; transform: translateY(-2px); }
                .no-action-label { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }

                .no-results { padding: 4rem; text-align: center; color: #94a3b8; font-style: italic; }

                .pagination { display: flex; justify-content: center; align-items: center; gap: 0.5rem; padding: 1.5rem; border-top: 1px solid #f1f5f9; background: #fff; }
                .pager-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
                .pager-btn:hover:not(:disabled) { border-color: #ffc451; color: #ffc451; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 196, 81, 0.2); }
                .pager-btn.active { background: #ffc451; border-color: #ffc451; color: #fff; box-shadow: 0 4px 10px rgba(255, 196, 81, 0.25); }
                .pager-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                @media (max-width: 768px) {
                    .rewards-container { padding: 1.25rem 1rem; }
                    .rewards-header { flex-direction: column; align-items: stretch; gap: 1.25rem; margin-bottom: 2rem; }
                    .header-actions { flex-direction: column; gap: 0.75rem; }
                    .export-btn, .add-points-btn { width: 100%; justify-content: center; }
                    .header-info h3 { font-size: 1.75rem; font-weight: 800; }
                    
                    .table-card { background: transparent; border: none; box-shadow: none; overflow: visible; }
                    .table-actions { padding: 0; margin-bottom: 1.5rem; }
                    .search-box { max-width: 100%; }

                    .rewards-cards-mobile { display: grid; grid-template-columns: 1fr; gap: 0.75rem; padding: 0; background: transparent; }
                    .reward-mobile-card { background: #fff; border-radius: 18px; border: 1px solid #f1f5f9; padding: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                    .card-header-tx { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px dashed #f1f5f9; }
                    .tx-date-wrap { display: flex; flex-direction: column; }
                    .tx-d { font-weight: 800; color: #0f172a; font-size: 0.875rem; }
                    .tx-t { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    
                    .card-body-tx { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
                    .tx-row { display: flex; justify-content: space-between; align-items: center; }
                    .tx-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                    .tx-val { font-size: 0.875rem; font-weight: 700; color: #1e293b; }
                    .tx-val-group { display: flex; flex-direction: column; align-items: flex-end; }
                    .order-ref { color: #ffc451; font-family: monospace; }
                    .tx-invoice-date { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
                    
                    .card-footer-tx { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 0.75rem; border-top: 1px solid #f8fafc; }
                    .tx-amount-section { display: flex; flex-direction: column; gap: 0.25rem; }
                    .amount-val-mobile { font-size: 1.125rem; font-weight: 800; }
                    .amount-val-mobile.earned { color: #10b981; }
                    .amount-val-mobile.used { color: #ef4444; }
                    
                    .mob-view-btn { width: 40px; height: 40px; border-radius: 10px; background: #f1f5f9; color: #475569; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; text-decoration: none; border: 1px solid #e2e8f0; }
                    .mob-view-btn:active { background: #ffc451; color: #fff; transform: scale(0.95); }
                    
                    .pagination { padding: 1.25rem; gap: 0.35rem; }
                    .pager-btn { width: 36px; height: 36px; border-radius: 10px; font-size: 0.875rem; }
                }

                /* Premium Calendar Styles */
                .calendar-picker-container { position: relative; width: 100%; }
                .calendar-trigger-fancy {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    border-radius: 14px;
                    border: 2px solid #f1f5f9;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.95rem;
                    color: #475569;
                }
                .calendar-trigger-fancy:hover { border-color: #cbd5e1; background: #fff; }
                .calendar-trigger-fancy.active { border-color: #ffc451; background: #fff; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.1); }
                .calendar-trigger-fancy i { color: #94a3b8; font-size: 1.1rem; }
                .calendar-trigger-fancy.active i { color: #ffc451; }
                
                .premium-calendar-dropdown {
                    position: absolute;
                    top: 110%;
                    right: 0;
                    width: 320px;
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 15px 45px rgba(15, 23, 42, 0.2);
                    z-index: 1000;
                    padding: 1.5rem;
                    animation: calPopUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @media (max-width: 450px) {
                    .premium-calendar-dropdown {
                        width: 280px;
                        padding: 1rem;
                    }
                }
                @keyframes calPopUp {
                    from { transform: translateY(10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
                .month-year { font-weight: 800; color: #0f172a; font-size: 1rem; }
                .nav-btn { background: #f8fafc; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; }
                .nav-btn:hover { background: #f1f5f9; color: #0f172a; }

                .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; margin-bottom: 0.75rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; }
                .wd { text-align: center; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }

                .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
                .cal-day {
                    aspect-ratio: 1;
                    padding: 0;
                    background: transparent;
                    border: none;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                .d-num { font-size: 0.9rem; font-weight: 600; color: #475569; z-index: 2; }
                .cal-day:hover { background: #f8fafc; }
                .cal-day:hover .d-num { color: #0f172a; }
                
                .cal-day.other-month { opacity: 0.3; }
                .cal-day.today { background: #fffbeb; border: 1px solid #ffc451; }
                .cal-day.today .d-num { color: #92400e; font-weight: 800; }
                
                .cal-day.selected { background: #ffc451; box-shadow: 0 4px 12px rgba(255, 196, 81, 0.4); border: none; }
                .cal-day.selected .d-num { color: #1a1a2e; font-weight: 800; }
                
                .cal-footer { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
                .today-btn { width: 100%; padding: 0.6rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.8rem; font-weight: 700; color: #475569; cursor: pointer; transition: all 0.2s; }
                .today-btn:hover { background: #ffc451; border-color: #ffc451; color: #1a1a2e; }
            `}</style>
        </div>
    );
}
