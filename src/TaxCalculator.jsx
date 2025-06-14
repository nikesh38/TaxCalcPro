import React, { useState, useEffect } from 'react';
import { Calculator, FileText, TrendingUp, Users, Shield, Clock, CheckCircle, IndianRupee } from 'lucide-react';

const TaxCalculator = () => {
  const [income, setIncome] = useState('');
  const [deductions, setDeductions] = useState('');
  const [regime, setRegime] = useState('new');
  const [taxYear, setTaxYear] = useState('2025-26');
  const [results, setResults] = useState(null);

  // Indian Tax brackets for different regimes and years
  const taxBrackets = {
    // New Regime FY 2025-26 (Proposed)
    'new-2025-26': [
      { min: 0, max: 400000, rate: 0.00 },
      { min: 400000, max: 800000, rate: 0.05 },
      { min: 800000, max: 1200000, rate: 0.10 },
      { min: 1200000, max: 1600000, rate: 0.15 },
      { min: 1600000, max: 2000000, rate: 0.20 },
      { min: 2000000, max: 2400000, rate: 0.25 },
      { min: 2400000, max: Infinity, rate: 0.30 }
    ],
    // Old Regime (continues for all years)
    'old-2025-26': [
      { min: 0, max: 250000, rate: 0.00 },
      { min: 250000, max: 500000, rate: 0.05 },
      { min: 500000, max: 1000000, rate: 0.20 },
      { min: 1000000, max: Infinity, rate: 0.30 }
    ],
    // New Regime FY 2024-25 and earlier
    'new-2024-25': [
      { min: 0, max: 300000, rate: 0.00 },
      { min: 300000, max: 600000, rate: 0.05 },
      { min: 600000, max: 900000, rate: 0.10 },
      { min: 900000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 1500000, rate: 0.20 },
      { min: 1500000, max: Infinity, rate: 0.30 }
    ]
  };

  // Standard deductions and rebates
  const getStandardDeduction = (regime, year) => {
    if (regime === 'new' && year === '2025-26') return 75000; // Proposed increase
    if (regime === 'old') return 50000;
    return 50000; // Default for other cases
  };

  const getRebateLimit = (regime, year) => {
    if (regime === 'new' && year === '2025-26') return { limit: 800000, rebate: 60000 };
    if (regime === 'new') return { limit: 700000, rebate: 25000 };
    if (regime === 'old') return { limit: 500000, rebate: 12500 };
    return { limit: 500000, rebate: 12500 };
  };

  const calculateTax = () => {
    const grossIncome = parseFloat(income) || 0;
    const totalDeductions = parseFloat(deductions) || 0;
    const standardDeduction = getStandardDeduction(regime, taxYear);
    const rebateInfo = getRebateLimit(regime, taxYear);
    
    // Calculate taxable income
    let taxableIncome;
    if (regime === 'new') {
      // New regime: Only standard deduction (no 80C, HRA etc.)
      taxableIncome = Math.max(0, grossIncome - standardDeduction);
    } else {
      // Old regime: Standard deduction + other deductions
      taxableIncome = Math.max(0, grossIncome - standardDeduction - totalDeductions);
    }
    
    // Get appropriate tax brackets
    const bracketKey = `${regime}-${taxYear}`;
    const brackets = taxBrackets[bracketKey] || taxBrackets[`${regime}-2024-25`] || taxBrackets['old-2025-26'];
    
    let tax = 0;
    let remainingIncome = taxableIncome;

    // Calculate tax based on slabs
    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableAtThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableAtThisBracket * bracket.rate;
      remainingIncome -= taxableAtThisBracket;
    }

    // Apply rebate under Section 87A
    let finalTax = tax;
    let rebateApplied = 0;
    if (grossIncome <= rebateInfo.limit) {
      rebateApplied = Math.min(tax, rebateInfo.rebate);
      finalTax = tax - rebateApplied;
    }

    // Add Health & Education Cess (4%)
    const cessAmount = finalTax * 0.04;
    const totalTax = finalTax + cessAmount;

    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
    const marginalRate = brackets.find(b => taxableIncome > b.min && taxableIncome <= b.max)?.rate * 100 || 0;
    const afterTaxIncome = grossIncome - totalTax;

    setResults({
      grossIncome,
      standardDeduction,
      otherDeductions: regime === 'new' ? 0 : totalDeductions,
      taxableIncome,
      baseTax: tax,
      rebateApplied,
      cessAmount,
      totalTax,
      effectiveRate,
      marginalRate,
      afterTaxIncome,
      regime,
      taxYear
    });
  };

  useEffect(() => {
    if (income && parseFloat(income) > 0) {
      calculateTax();
    }
  }, [income, deductions, regime, taxYear]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (rate) => {
    return `${rate.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-600 to-green-600 p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Indian Tax Calculator</h1>
                <p className="text-sm text-gray-600">Income Tax Calculator for India</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <span className="text-sm text-gray-600">FY {taxYear}</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                🇮🇳 India
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Calculator */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <IndianRupee className="h-5 w-5 mr-2" />
                  Indian Income Tax Calculator
                </h2>
                <p className="text-orange-100 text-sm mt-1">Calculate your income tax for both old and new regime</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Gross Income
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Enter your annual income"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Deductions (Old Regime Only)
                      <span className="text-xs text-gray-500 block">80C, HRA, 80D etc.</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={deductions}
                        onChange={(e) => setDeductions(e.target.value)}
                        disabled={regime === 'new'}
                        className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${regime === 'new' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder={regime === 'new' ? 'Not applicable in new regime' : 'Enter deductions'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Regime
                    </label>
                    <select
                      value={regime}
                      onChange={(e) => setRegime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="new">New Tax Regime (Default)</option>
                      <option value="old">Old Tax Regime</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Financial Year
                    </label>
                    <select
                      value={taxYear}
                      onChange={(e) => setTaxYear(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                      <option value="2025-26">FY 2025-26 (AY 2026-27)</option>
                      <option value="2024-25">FY 2024-25 (AY 2025-26)</option>
                    </select>
                  </div>
                </div>

                {results && (
                  <div className="mt-8 p-6 bg-gradient-to-br from-orange-50 to-green-50 rounded-xl border border-orange-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                      Tax Calculation Results - {results.regime === 'new' ? 'New' : 'Old'} Regime
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Gross Income</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(results.grossIncome)}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Standard Deduction</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.standardDeduction)}</p>
                      </div>

                      {results.otherDeductions > 0 && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Other Deductions</p>
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.otherDeductions)}</p>
                        </div>
                      )}
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Taxable Income</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(results.taxableIncome)}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Tax Before Rebate</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(results.baseTax)}</p>
                      </div>

                      {results.rebateApplied > 0 && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Rebate u/s 87A</p>
                          <p className="text-2xl font-bold text-green-600">-{formatCurrency(results.rebateApplied)}</p>
                        </div>
                      )}

                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Health & Education Cess (4%)</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(results.cessAmount)}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-red-200">
                        <p className="text-sm text-gray-600">Total Tax Payable</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(results.totalTax)}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">After-Tax Income</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(results.afterTaxIncome)}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Effective Tax Rate</p>
                        <p className="text-2xl font-bold text-purple-600">{formatPercentage(results.effectiveRate)}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Marginal Tax Rate</p>
                        <p className="text-2xl font-bold text-purple-600">{formatPercentage(results.marginalRate)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tax Slabs Info */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Tax Slabs FY {taxYear}
                </h3>
              </div>
              <div className="p-6">
                {taxYear === '2025-26' && regime === 'new' ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">New Regime (Proposed)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>₹0 - ₹4L</span><span className="font-medium text-green-600">0%</span></div>
                      <div className="flex justify-between"><span>₹4L - ₹8L</span><span className="font-medium">5%</span></div>
                      <div className="flex justify-between"><span>₹8L - ₹12L</span><span className="font-medium">10%</span></div>
                      <div className="flex justify-between"><span>₹12L - ₹16L</span><span className="font-medium">15%</span></div>
                      <div className="flex justify-between"><span>₹16L - ₹20L</span><span className="font-medium">20%</span></div>
                      <div className="flex justify-between"><span>₹20L - ₹24L</span><span className="font-medium">25%</span></div>
                      <div className="flex justify-between"><span>Above ₹24L</span><span className="font-medium text-red-600">30%</span></div>
                    </div>
                  </div>
                ) : regime === 'old' ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Old Regime</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>₹0 - ₹2.5L</span><span className="font-medium text-green-600">0%</span></div>
                      <div className="flex justify-between"><span>₹2.5L - ₹5L</span><span className="font-medium">5%</span></div>
                      <div className="flex justify-between"><span>₹5L - ₹10L</span><span className="font-medium">20%</span></div>
                      <div className="flex justify-between"><span>Above ₹10L</span><span className="font-medium text-red-600">30%</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">New Regime</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>₹0 - ₹3L</span><span className="font-medium text-green-600">0%</span></div>
                      <div className="flex justify-between"><span>₹3L - ₹6L</span><span className="font-medium">5%</span></div>
                      <div className="flex justify-between"><span>₹6L - ₹9L</span><span className="font-medium">10%</span></div>
                      <div className="flex justify-between"><span>₹9L - ₹12L</span><span className="font-medium">15%</span></div>
                      <div className="flex justify-between"><span>₹12L - ₹15L</span><span className="font-medium">20%</span></div>
                      <div className="flex justify-between"><span>Above ₹15L</span><span className="font-medium text-red-600">30%</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Tax Tips
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Choose Your Regime</p>
                      <p className="text-xs text-gray-600">Compare old vs new regime based on your deductions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Standard Deduction</p>
                      <p className="text-xs text-gray-600">{regime === 'new' && taxYear === '2025-26' ? '₹75,000' : '₹50,000'} automatically included</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Rebate u/s 87A</p>
                      <p className="text-xs text-gray-600">Available for lower income brackets</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Changes */}
            {taxYear === '2025-26' && (
              <div className="bg-gradient-to-br from-orange-50 to-green-50 rounded-2xl p-6 border border-orange-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Changes FY 2025-26</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-green-700">• New regime: Tax-free income up to ₹4 lakh</p>
                  <p className="text-green-700">• Standard deduction increased to ₹75,000</p>
                  <p className="text-green-700">• Rebate u/s 87A increased to ₹60,000</p>
                  <p className="text-blue-700">• Additional tax slabs for better tax distribution</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Indian Tax Calculator. This calculator provides estimates for educational purposes only. 
              Consult a tax professional for official tax advice.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Tax rates based on Income Tax Act and Budget 2025 proposals
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TaxCalculator;