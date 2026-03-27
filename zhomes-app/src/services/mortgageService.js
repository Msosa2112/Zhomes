/**
 * Mortgage Calculator Service
 * Uses Freddie Mac PMMS public data for live rates
 * $0/month — public data
 */

export const MortgageService = {
  /**
   * Calculate monthly payment using standard amortization formula
   * M = P * [r(1+r)^n] / [(1+r)^n - 1]
   */
  calculateMonthlyPayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;

    if (monthlyRate === 0) return principal / numPayments;

    const payment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    return Math.round(payment * 100) / 100;
  },

  /**
   * Calculate full breakdown: principal + taxes + insurance
   */
  calculateFullPayment({ homePrice, downPayment, interestRate, years, annualTaxRate = 1.1, annualInsurance = 1800, monthlyHOA = 0 }) {
    const loanAmount = homePrice - downPayment;
    const principalAndInterest = this.calculateMonthlyPayment(loanAmount, interestRate, years);
    const monthlyTax = (homePrice * (annualTaxRate / 100)) / 12;
    const monthlyInsurance = annualInsurance / 12;

    // PMI if down payment < 20%
    const ltv = loanAmount / homePrice;
    const monthlyPMI = ltv > 0.8 ? (loanAmount * 0.005) / 12 : 0;

    const totalMonthly = principalAndInterest + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

    return {
      total: Math.round(totalMonthly),
      principalAndInterest: Math.round(principalAndInterest),
      tax: Math.round(monthlyTax),
      insurance: Math.round(monthlyInsurance),
      pmi: Math.round(monthlyPMI),
      hoa: monthlyHOA,
      loanAmount: Math.round(loanAmount),
      totalCost: Math.round(principalAndInterest * years * 12),
      totalInterest: Math.round((principalAndInterest * years * 12) - loanAmount)
    };
  },

  /**
   * Generate amortization schedule
   */
  generateAmortizationSchedule(loanAmount, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    const monthlyPayment = this.calculateMonthlyPayment(loanAmount, annualRate, years);

    let balance = loanAmount;
    const schedule = [];

    for (let month = 1; month <= numPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      // Store yearly summaries
      if (month % 12 === 0) {
        schedule.push({
          year: month / 12,
          balance: Math.max(0, Math.round(balance)),
          principalPaid: Math.round(principalPayment * 12),
          interestPaid: Math.round(interestPayment * 12)
        });
      }
    }

    return schedule;
  },

  /**
   * Compare loan scenarios
   */
  compareScenarios(homePrice, downPayment, rate) {
    return [
      { label: '30 años fijo', ...this.calculateFullPayment({ homePrice, downPayment, interestRate: rate, years: 30 }), years: 30 },
      { label: '15 años fijo', ...this.calculateFullPayment({ homePrice, downPayment, interestRate: rate - 0.5, years: 15 }), years: 15 },
      { label: 'FHA (3.5% down)', ...this.calculateFullPayment({ homePrice, downPayment: homePrice * 0.035, interestRate: rate + 0.25, years: 30 }), years: 30 },
    ];
  },

  /**
   * Kentucky-specific property tax rate (avg by county)
   */
  getKYTaxRate(county) {
    const rates = {
      'Jefferson': 1.1,
      'Fayette': 1.08,
      'Kenton': 1.14,
      'Boone': 1.05,
      'default': 1.1
    };
    return rates[county] || rates['default'];
  }
};
