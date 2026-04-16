const PDFDocument = require('pdfkit');
const fs = require('fs');

function createPurchaseAgreement() {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('Realtor_Purchase_Agreement.pdf'));

  doc.fontSize(20).text('RESIDENTIAL REAL ESTATE PURCHASE AGREEMENT', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('Date: April 16, 2026');
  doc.text('This Purchase Agreement (the "Agreement") is entered into by and between:');
  doc.moveDown();
  doc.text('BUYER: Jonathan Davis');
  doc.text('SELLER: Maria Gonzales');
  doc.moveDown();
  doc.text('1. PROPERTY ADDRESS: 123 Main St, Springfield, KY 40069');
  doc.text('2. PURCHASE PRICE: $350,000.00 (Three Hundred Fifty Thousand Dollars)');
  doc.text('3. EARNEST MONEY DEPOSIT: $5,000.00 to be deposited within 3 days of acceptance.');
  doc.text('4. CLOSING DATE: The closing shall occur on or before May 15, 2026.');
  doc.text('5. INSPECTION PERIOD: Buyer has 10 days from the effective date to conduct property inspections.');
  doc.moveDown();
  doc.text('6. ADDITIONAL TERMS: Property is sold AS-IS. Seller agrees to leave all major appliances, including refrigerator and washer/dryer.');
  doc.moveDown(2);
  doc.text('Buyer Signature: _______________________      Date: ____________');
  doc.moveDown();
  doc.text('Seller Signature: _______________________     Date: ____________');

  doc.end();
}

function createAgencyDisclosure() {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('Realtor_Agency_Disclosure.pdf'));

  doc.fontSize(20).text('KENTUCKY REAL ESTATE AGENCY DISCLOSURE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('Date: April 16, 2026');
  doc.moveDown();
  doc.text('PROPERTY ADDRESS: 123 Main St, Springfield, KY 40069');
  doc.moveDown();
  doc.text('This document serves to disclose the type of working relationship between the Agent and the Client.');
  doc.text('The Agent is representing the:');
  doc.text('[X] BUYER ONLY');
  doc.text('[ ] SELLER ONLY');
  doc.text('[ ] BOTH BUYER AND SELLER (Dual Agency)');
  doc.moveDown();
  doc.text('Agent Name: Sarah Jennings, Realtor');
  doc.text('Brokerage: Elite Homes Realty LLC');
  doc.moveDown();
  doc.text('Client Name: Jonathan Davis');
  doc.moveDown();
  doc.text('Client Signature: _______________________     Date: April 16, 2026');

  doc.end();
}

function createBankStatement() {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('Client_Bank_Statement.pdf'));

  doc.fontSize(20).text('FIRST NATIONAL BANK', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text('Account Statement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('Account Holder: Jonathan Davis');
  doc.text('Address: 456 Elm St, Louisville, KY 40202');
  doc.text('Statement Period: March 01, 2026 - March 31, 2026');
  doc.moveDown();
  doc.text('ACCOUNT SUMMARY');
  doc.text('-----------------------------------');
  doc.text('Beginning Balance:           $42,150.00');
  doc.text('Deposits and Credits:        $8,500.00');
  doc.text('Withdrawals and Debits:      -$3,200.00');
  doc.text('-----------------------------------');
  doc.text('Ending Balance:              $47,450.00');
  doc.moveDown(2);
  doc.fontSize(10).text('CONFIDENTIAL. THIS DOCUMENT IS INTENDED FOR VERIFICATION OF FUNDS.', { align: 'center' });

  doc.end();
}

function createClientID() {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('Client_ID.pdf'));

  doc.fontSize(16).text('KENTUCKY DRIVER LICENSE', { align: 'center' });
  doc.moveDown();
  // Simulate a realistic looking layout with text
  doc.fontSize(10).text('DL No: K12345678');
  doc.text('DOB: 05/12/1985');
  doc.text('Exp Date: 05/12/2028');
  doc.text('Class: D');
  doc.moveDown();
  doc.fontSize(14).text('Name: DAVIS, JONATHAN MICHAEL');
  doc.fontSize(12).text('Address: 456 ELM ST, LOUISVILLE, KY 40202');
  doc.moveDown(2);
  doc.fontSize(10).text('Sex: M    Hgt: 6-0    Eyes: BRO');
  doc.moveDown(2);
  doc.text('<< Picture Placeholder >>', { align: 'center' });

  doc.end();
}

createPurchaseAgreement();
createAgencyDisclosure();
createBankStatement();
createClientID();

console.log('Successfully generated 4 mock PDFs in the current directory.');
