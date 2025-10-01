import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, DollarSign, CreditCard, Clock, Receipt, TrendingUp, CheckCircle, Users, Calendar, AlertCircle } from 'lucide-react';
import api from '../services/api';
export default function CreditListingPage() {
  const [expandedId, setExpandedId] = useState(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [extendAmount, setExtendAmount] = useState('');
  const [selectedCreditHistory, setSelectedCreditHistory] = useState('');
  const [extensionDate, setExtensionDate] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  // Sample credit data
  const [credits, setCredits] = useState([
    {
      id: 1,
      customerName: 'John Smith',
      totalCredit: 5000,
      creditLeft: 2500,
      invoiceNo: 'INV-001',
      expiresAt: '2025-12-15',
      creditHistory: [
        { date: '2025-01-15', amount: 5000, invoiceNo: 'INV-001', type: 'Initial Credit', status: 'Granted' },
        { date: '2025-03-20', amount: 2000, invoiceNo: 'INV-001-EXT', type: 'Credit Extension', status: 'Granted' }
      ],
      paymentHistory: [
        { date: '2025-01-20', amount: 1500, invoiceNo: 'INV-001-01', type: 'Payment', method: 'Bank Transfer' },
        { date: '2025-02-10', amount: 1000, invoiceNo: 'INV-001-02', type: 'Payment', method: 'Cash' },
        { date: '2025-03-15', amount: 2000, invoiceNo: 'INV-001-03', type: 'Payment', method: 'Cheque' }
      ]
    },
    {
      id: 2,
      customerName: 'Sarah Johnson',
      totalCredit: 8000,
      creditLeft: 6200,
      invoiceNo: 'INV-002',
      expiresAt: '2025-10-20',
      creditHistory: [
        { date: '2025-01-10', amount: 8000, invoiceNo: 'INV-002', type: 'Initial Credit', status: 'Granted' }
      ],
      paymentHistory: [
        { date: '2025-01-25', amount: 1800, invoiceNo: 'INV-002-01', type: 'Payment', method: 'Bank Transfer' }
      ]
    },
    {
      id: 3,
      customerName: 'Michael Brown',
      totalCredit: 3500,
      creditLeft: 0,
      invoiceNo: 'INV-003',
      expiresAt: '2026-03-10',
      creditHistory: [
        { date: '2025-01-05', amount: 3500, invoiceNo: 'INV-003', type: 'Initial Credit', status: 'Granted' }
      ],
      paymentHistory: [
        { date: '2025-01-15', amount: 2000, invoiceNo: 'INV-003-01', type: 'Payment', method: 'Cash' },
        { date: '2025-02-20', amount: 1500, invoiceNo: 'INV-003-02', type: 'Payment', method: 'Bank Transfer' }
      ]
    },
    {
      id: 4,
      customerName: 'Emily Davis',
      totalCredit: 12000,
      creditLeft: 9500,
      invoiceNo: 'INV-004',
      expiresAt: '2025-11-25',
      creditHistory: [
        { date: '2025-01-20', amount: 10000, invoiceNo: 'INV-004', type: 'Initial Credit', status: 'Granted' },
        { date: '2025-02-15', amount: 2000, invoiceNo: 'INV-004-EXT', type: 'Credit Extension', status: 'Granted' }
      ],
      paymentHistory: [
        { date: '2025-02-01', amount: 2500, invoiceNo: 'INV-004-01', type: 'Payment', method: 'Cheque' }
      ]
    },
    {
      id: 5,
      customerName: 'David Wilson',
      totalCredit: 6500,
      creditLeft: 3200,
      invoiceNo: 'INV-005',
      expiresAt: '2025-10-05',
      creditHistory: [
        { date: '2025-02-01', amount: 6500, invoiceNo: 'INV-005', type: 'Initial Credit', status: 'Granted' }
      ],
      paymentHistory: [
        { date: '2025-02-10', amount: 3300, invoiceNo: 'INV-005-01', type: 'Payment', method: 'Bank Transfer' }
      ]
    }
  ]);
  const fetchData = async () =>{
    try{
      const response = await api.get('/main/credit-report/');
      // Handle the correct backend response structure
      console.table(response.data);
      if (response.data && Array.isArray(response.data.creditReports)) {
        setCredits(response.data.creditReports);
      } else if (Array.isArray(response.data)) {
        setCredits(response.data);
      } else if (response.data && Array.isArray(response.data.results)) {
        setCredits(response.data.results);
      } else if (response.data && Array.isArray(response.data.credits)) {
        setCredits(response.data.credits);
      } else {
        console.log('Unexpected response structure:', response.data);
        setCredits([]); // Fallback to empty array
      }
    }catch(error){
      console.log(error);
      setCredits([]); // Fallback to empty array on error
    }
  }
  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleShowDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleExtendCredit = (customer) => {
    setSelectedCustomer(customer);
    setShowExtendModal(true);
  };

  const submitExtendCredit = async () => {
    if (extendAmount && selectedCustomer && selectedCreditHistory && extensionDate) {
      setIsExtending(true);
      try {
        const selectedHistory = JSON.parse(selectedCreditHistory);
        
        // Prepare the extension data
        const extensionData = {
          customerId: selectedCustomer.id,
          creditHistoryId: selectedHistory.id || selectedHistory.invoiceNo,
          amount: parseFloat(extendAmount),
          extensionDate: extensionDate,
          invoiceNo: `${selectedHistory.invoiceNo}-EXT`
        };

        // Make API call to extend credit
        const response = await api.post('/main/credit-report/extend/', extensionData);
        
        if (response.data) {
          // Refresh the data from backend
          await fetchData();
          
          // Close modal and reset form
          setShowExtendModal(false);
          setExtendAmount('');
          setSelectedCreditHistory('');
          setExtensionDate('');
          setSelectedCustomer(null);
        }
      } catch (error) {
        console.error('Error extending credit:', error);
        // For now, fallback to local state update if API fails
        const selectedHistory = JSON.parse(selectedCreditHistory);
        
        // Create new credit history entry for the extension
        const newCreditEntry = {
          date: extensionDate,
          amount: parseFloat(extendAmount),
          invoiceNo: `${selectedHistory.invoiceNo}-EXT`,
          type: 'Credit Extension',
          status: 'Granted'
        };

        setCredits(credits.map(c => 
          c.id === selectedCustomer.id 
            ? { 
                ...c, 
                totalCredit: c.totalCredit + parseFloat(extendAmount), 
                creditLeft: c.creditLeft + parseFloat(extendAmount),
                creditHistory: [...c.creditHistory, newCreditEntry]
              }
            : c
        ));
        setShowExtendModal(false);
        setExtendAmount('');
        setSelectedCreditHistory('');
        setExtensionDate('');
        setSelectedCustomer(null);
      } finally {
        setIsExtending(false);
      }
    }
  };

  const calculateDaysLeft = (expiresAt) => {
    const today = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOldestDate = (creditHistory) => {
    if (!creditHistory || creditHistory.length === 0) return null;
    const dates = creditHistory.map(h => new Date(h.date));
    return new Date(Math.min(...dates));
  };

  const getDaysStatus = (daysLeft) => {
    if (daysLeft < 0) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Expired' };
    if (daysLeft <= 30) return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Urgent' };
    if (daysLeft <= 90) return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Soon' };
    return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Active' };
  };

  const calculateAmountDueForCreditHistory = (creditHistory, customer) => {
    if (!creditHistory || !customer) return 0;
    
    // Find payments related to this specific credit history entry
    const relatedPayments = customer.paymentHistory.filter(payment => 
      payment.invoiceNo.includes(creditHistory.invoiceNo) || 
      payment.invoiceNo === creditHistory.invoiceNo
    );
    
    // Calculate total payments for this credit entry
    const totalPayments = relatedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Amount due = original credit amount - payments made
    const amountDue = creditHistory.amount - totalPayments;
    
    return Math.max(0, amountDue); // Ensure it's not negative
  };

  const totalCredits = credits && Array.isArray(credits) ? credits.reduce((sum, c) => sum + (c.totalCredit || 0), 0) : 0;
  const totalOutstanding = credits && Array.isArray(credits) ? credits.reduce((sum, c) => sum + (c.creditLeft || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-3 rounded-xl">
              <CreditCard className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
              <p className="text-gray-600 mt-1">Monitor and manage customer credits</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{credits && Array.isArray(credits) ? credits.length : 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Credits</p>
                  <p className="text-2xl font-bold text-gray-900">AED {totalCredits.toLocaleString()}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900">AED {totalOutstanding.toLocaleString()}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {credits && Array.isArray(credits) ? credits.map((credit) => {
            const daysLeft = calculateDaysLeft(credit.expiresAt);
            const status = getDaysStatus(daysLeft);
            const oldestDate = getOldestDate(credit.creditHistory);
            
            return (
              <div key={credit.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <Users className="text-gray-700" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{credit.customerName}</h3>
                        {oldestDate && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            Started: {oldestDate.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color} border ${status.border}`}>
                      {status.label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Credit Amount</p>
                      <p className="text-lg font-bold text-gray-900">AED {credit.totalCredit.toLocaleString()}</p>
                    </div>
                    <div className={`rounded-lg p-3 border ${credit.creditLeft === 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                      <p className="text-xs text-gray-600 mb-1">Credit Left</p>
                      <p className={`text-lg font-bold ${credit.creditLeft === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        AED {credit.creditLeft.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {credit.creditLeft === 0 ? (
                    <div className="rounded-lg p-3 mb-4 border bg-green-50 border-green-200">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="text-green-600" size={20} />
                        <span className="text-sm font-bold text-green-600">All Settled</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-lg p-3 mb-4 border ${status.bg} ${status.border}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className={status.color} size={16} />
                          <span className="text-sm font-medium text-gray-700">Expires: {credit.expiresAt}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {daysLeft < 0 ? (
                            <AlertCircle className="text-red-600" size={16} />
                          ) : (
                            <Clock className={status.color} size={16} />
                          )}
                          <span className={`text-sm font-bold ${status.color}`}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExtendCredit(credit)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                    >
                      <Plus size={16} />
                      Extend Credit
                    </button>
                    <button
                      onClick={() => {
                        const isLargeScreen = window.innerWidth >= 1024;
                        if (isLargeScreen) {
                          handleShowDetails(credit);
                        } else {
                          toggleExpand(credit.id);
                        }
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                    >
                      {expandedId === credit.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {expandedId === credit.id ? 'Less' : 'More'}
                    </button>
                  </div>
                </div>

                {expandedId === credit.id && (
                  <div className="bg-gray-50 p-5 border-t border-gray-200 lg:hidden">
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="text-gray-600" size={14} />
                          <p className="text-xs text-gray-600">Invoice Number</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{credit.invoiceNo}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="text-gray-600" size={14} />
                          <p className="text-xs text-gray-600">Amount Paid</p>
                        </div>
                        <p className="text-sm font-bold text-green-600">
                          AED {(credit.totalCredit - credit.creditLeft).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Credit History Section */}
                    <div className="mb-5">
                      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600" />
                        Credit History
                      </h4>
                      <div className="space-y-2">
                        {credit.creditHistory.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                  <CreditCard className="text-blue-600" size={16} />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{item.type}</p>
                                  <p className="text-xs text-gray-600">{item.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 text-sm">AED {item.amount.toLocaleString()}</p>
                                <p className="text-xs text-gray-600">{item.invoiceNo}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment History Section */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        Payment History
                      </h4>
                      <div className="space-y-2">
                        {credit.paymentHistory.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                  <DollarSign className="text-green-600" size={16} />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{item.type}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-gray-600">{item.date}</p>
                                    <span className="text-xs text-gray-400">•</span>
                                    <p className="text-xs text-gray-600">{item.method}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-gray-900 text-sm">AED {item.amount.toLocaleString()}</p>
                                <p className="text-xs text-gray-600">{item.invoiceNo}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="col-span-full text-center py-12">
              <div className="bg-gray-100 p-6 rounded-xl">
                <p className="text-gray-600 text-lg">No credit data available</p>
                <p className="text-gray-500 text-sm mt-2">Please check your API connection or data source</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extend Credit Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Plus className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Extend Credit</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  value={selectedCustomer?.customerName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Credit</label>
                <input
                  type="text"
                  value={`AED ${selectedCustomer?.totalCredit.toLocaleString()}`}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Credit History</label>
                <select
                  value={selectedCreditHistory}
                  onChange={(e) => {
                    setSelectedCreditHistory(e.target.value);
                    if (e.target.value) {
                      const history = JSON.parse(e.target.value);
                      const amountDue = calculateAmountDueForCreditHistory(history, selectedCustomer);
                      setExtendAmount(amountDue.toString());
                    } else {
                      setExtendAmount('');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a credit history entry</option>
                  {selectedCustomer?.creditHistory.map((history, index) => {
                    const amountDue = calculateAmountDueForCreditHistory(history, selectedCustomer);
                    return (
                      <option key={index} value={JSON.stringify(history)}>
                        {history.type} - AED {history.amount.toLocaleString()} (Due: AED {amountDue.toLocaleString()}) ({history.date}) - {history.invoiceNo}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Extension Date</label>
                <input
                  type="date"
                  value={extensionDate}
                  onChange={(e) => setExtensionDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Extend (Auto-calculated from selected credit history)</label>
                <input
                  type="number"
                  value={extendAmount}
                  onChange={(e) => setExtendAmount(e.target.value)}
                  placeholder="Amount will be auto-filled based on credit history selection"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  readOnly={selectedCreditHistory !== ''}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={submitExtendCredit}
                disabled={isExtending}
                className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  isExtending ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isExtending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Extending...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setExtendAmount('');
                  setSelectedCreditHistory('');
                  setExtensionDate('');
                  setSelectedCustomer(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal for Large Screens */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <Users size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCustomer.customerName}</h2>
                    <p className="text-blue-100 text-sm">Customer Details</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <ChevronUp size={24} />
                </button>
              </div>

              {/* Summary Cards in Header */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-100 mb-1">Total Credit</p>
                  <p className="text-lg font-bold">AED {selectedCustomer.totalCredit.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-100 mb-1">Credit Left</p>
                  <p className="text-lg font-bold">AED {selectedCustomer.creditLeft.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-xs text-blue-100 mb-1">Amount Paid</p>
                  <p className="text-lg font-bold">AED {(selectedCustomer.totalCredit - selectedCustomer.creditLeft).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Credit History Section */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <TrendingUp className="text-white" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Credit History</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedCustomer.creditHistory.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <CreditCard className="text-blue-600" size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{item.type}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{item.date}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-600">{item.invoiceNo}</p>
                          <p className="text-lg font-bold text-blue-600">AED {item.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment History Section */}
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-green-600 p-2 rounded-lg">
                      <CheckCircle className="text-white" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedCustomer.paymentHistory.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg">
                              <DollarSign className="text-green-600" size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{item.type}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-gray-600">{item.date}</p>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-gray-600">{item.method}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-600">{item.invoiceNo}</p>
                          <p className="text-lg font-bold text-green-600">AED {item.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}