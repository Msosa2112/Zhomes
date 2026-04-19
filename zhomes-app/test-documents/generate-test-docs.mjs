import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputDir = './test-documents';

// ── Datos reales ──────────────────────────────────────────────
const SELLER        = 'Ernesto Cougil';
const BUYER         = 'Miguel Sosa';
const BUYER_ADDR    = '2901 Abigail Dr, Louisville, KY';
const BUYER_PHONE   = '(502) 658-7853';
const BUYER_EMAIL   = 'miguesosagarcia@gmail.com';
const PROPERTY      = '7809 Broadwater Pl, Louisville, KY 40228';
const COUNTY        = 'Jefferson County';
const PRICE         = '$285,000.00';
const EARNEST       = '$8,550.00';
const CLOSE_DATE    = 'June 15, 2026';
const EFFECTIVE     = 'April 19, 2026';
const AGENT_NAME    = 'Gilbert Zaldivar';
const AGENT_LIC     = '216658';
const AGENT_PHONE   = '(502) 641-6623';
const OFFICE_NAME   = 'ZHomes Real Estate';
const OFFICE_ADDR   = '7520 Preston Highway, Louisville, KY 40219';
const OFFICE_PHONE  = '(502) 641-6623';

// ────────────────────────────────────────────────────────────────
// 1. LEAD PAINT DISCLOSURE
// ────────────────────────────────────────────────────────────────
function generateLeadPaint() {
  const doc = new PDFDocument({ margin: 60 });
  doc.pipe(fs.createWriteStream(path.join(outputDir, 'lead_paint_disclosure.pdf')));

  doc.fontSize(14).font('Helvetica-Bold')
    .text('DISCLOSURE OF INFORMATION ON LEAD-BASED PAINT AND/OR LEAD-BASED PAINT HAZARDS', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(9).font('Helvetica').text('Pursuant to 42 U.S.C. § 4852d and 40 CFR Part 745', { align: 'center' });
  doc.moveDown();

  doc.fontSize(9).font('Helvetica')
    .text('Lead Warning Statement: Every buyer of any interest in residential real property on which a residential dwelling was built prior to 1978 is notified that such property may present exposure to lead from lead-based paint that may place young children at risk of developing lead poisoning.');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('PROPERTY INFORMATION:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Property Address: ${PROPERTY}`);
  doc.text(`County: ${COUNTY}, State: Kentucky`);
  doc.text(`Year Built: 1978 or earlier — Disclosure Required`);
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text("SELLER'S DISCLOSURE");
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Seller: ${SELLER}`);
  doc.moveDown(0.3);
  doc.text('(a) Presence of lead-based paint and/or lead-based paint hazards (check one):');
  doc.moveDown(0.2);
  doc.text('  [ ] Known lead-based paint and/or lead-based paint hazards are present in the housing.');
  doc.moveDown(0.2);
  doc.text('  [X] Seller has no knowledge of lead-based paint and/or lead-based paint hazards in the housing.');
  doc.moveDown(0.3);
  doc.text('(b) Records and reports available to the seller (check one):');
  doc.moveDown(0.2);
  doc.text('  [ ] Seller has provided the buyer with all available records and reports pertaining to lead-based paint.');
  doc.moveDown(0.2);
  doc.text('  [X] Seller has no reports or records pertaining to lead-based paint and/or lead-based paint hazards in the housing.');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text("BUYER'S ACKNOWLEDGMENT");
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Buyer: ${BUYER}   |   Address: ${BUYER_ADDR}   |   Phone: ${BUYER_PHONE}`);
  doc.text(`Email: ${BUYER_EMAIL}`);
  doc.moveDown(0.3);
  doc.text('(c) Buyer has received copies of all information listed above.');
  doc.text('(d) Buyer has received the EPA pamphlet "Protect Your Family From Lead In Your Home".');
  doc.text('(e) Buyer has received a 10-day opportunity to conduct a risk assessment or inspection for lead-based paint hazards.');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text("AGENT'S ACKNOWLEDGMENT");
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Listing Agent: ${AGENT_NAME}  |  License #: ${AGENT_LIC}  |  Office: ${OFFICE_NAME}`);
  doc.text(`Office Address: ${OFFICE_ADDR}  |  Phone: ${OFFICE_PHONE}`);
  doc.text('Agent has informed the seller of the seller\'s obligations under 42 U.S.C. 4852d and is aware of the responsibility to ensure compliance.');
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(10).text('CERTIFICATION OF ACCURACY');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('The following parties have reviewed the information above and certify, to the best of their knowledge, that the information they have provided is true and accurate.');
  doc.moveDown(1);
  doc.text(`Seller: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`         ${SELLER}`);
  doc.moveDown(0.5);
  doc.text(`Buyer: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`         ${BUYER}`);
  doc.moveDown(0.5);
  doc.text(`Agent: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`         ${AGENT_NAME}  |  ${OFFICE_NAME}  |  ${OFFICE_PHONE}`);

  doc.end();
  console.log('✅ lead_paint_disclosure.pdf generated');
}

// ────────────────────────────────────────────────────────────────
// 2. PURCHASE AGREEMENT
// ────────────────────────────────────────────────────────────────
function generatePurchaseAgreement() {
  const doc = new PDFDocument({ margin: 60 });
  doc.pipe(fs.createWriteStream(path.join(outputDir, 'florida_purchase_agreement.pdf')));

  doc.fontSize(14).font('Helvetica-Bold')
    .text('RESIDENTIAL CONTRACT FOR SALE AND PURCHASE', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('Kentucky — Residential Real Estate Transaction', { align: 'center' });
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('1. PARTIES:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Buyer:  ${BUYER}`);
  doc.text(`        ${BUYER_ADDR}   |   Phone: ${BUYER_PHONE}   |   Email: ${BUYER_EMAIL}`);
  doc.moveDown(0.3);
  doc.text(`Seller: ${SELLER}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('2. PROPERTY:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Property Address: ${PROPERTY}`);
  doc.text(`County: ${COUNTY}, State: Kentucky`);
  doc.text('Property Type: Residential – Single Family Residence');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('3. PURCHASE PRICE AND FINANCING:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Purchase Price:              ${PRICE}`);
  doc.text(`Earnest Money Deposit:       ${EARNEST} (3%)  —  Due within 3 business days of Effective Date`);
  doc.text('Escrow Agent:               First American Title — Louisville, KY');
  doc.text('Financing:                  Conventional Loan, 80% LTV ($228,000.00)');
  doc.text('Down Payment:               $57,000.00 (20%)');
  doc.text('Balance to Close:           $48,450.00 (approximate, subject to prorations and fees)');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('4. CRITICAL DATES AND DEADLINES:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Effective Date:             ${EFFECTIVE}`);
  doc.text('Inspection Period:          10 days from Effective Date — Expires April 29, 2026');
  doc.text('Loan Commitment Deadline:   May 20, 2026');
  doc.text('Title Commitment Deadline:  May 15, 2026');
  doc.text(`Closing Date:               ${CLOSE_DATE}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('5. CLOSING COSTS:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('Seller shall pay: Real Estate Commission (6% total), deed preparation, seller\'s attorney fees, any outstanding HOA balance.');
  doc.text('Buyer shall pay: Loan origination fees, appraisal, lender\'s title insurance, recording fees, buyer\'s attorney fees.');
  doc.text('Property taxes prorated to date of closing based on most recent tax bill.');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('6. REAL ESTATE BROKERS AND COMMISSIONS:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Listing Broker:     ${OFFICE_NAME}  |  ${OFFICE_ADDR}`);
  doc.text(`                    License #: ${AGENT_LIC}   Agent: ${AGENT_NAME}   Phone: ${AGENT_PHONE}`);
  doc.text('Commission:         6% of Purchase Price split equally between Listing and Cooperating Broker');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('7. CONDITIONS AND CONTINGENCIES:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('• This Contract is contingent upon Buyer obtaining written loan commitment by May 20, 2026.');
  doc.text('• Property sold in AS-IS condition subject to Buyer\'s inspection period.');
  doc.text('• Seller to provide all disclosures required by Kentucky law within 5 days of Effective Date.');
  doc.text('• HOA Disclosure, Lead Paint Disclosure, and Seller\'s Property Condition Disclosure attached and incorporated herein.');
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(10).text('SIGNATURES:');
  doc.font('Helvetica').fontSize(9).moveDown(0.5);
  doc.text(`Buyer: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`       ${BUYER}`);
  doc.moveDown(0.5);
  doc.text(`Seller: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`        ${SELLER}`);
  doc.moveDown(0.5);
  doc.text(`Agent: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`       ${AGENT_NAME}  |  ${OFFICE_NAME}  |  License #${AGENT_LIC}`);

  doc.end();
  console.log('✅ florida_purchase_agreement.pdf generated');
}

// ────────────────────────────────────────────────────────────────
// 3. HOA ADDENDUM
// ────────────────────────────────────────────────────────────────
function generateHOAAddendum() {
  const doc = new PDFDocument({ margin: 60 });
  doc.pipe(fs.createWriteStream(path.join(outputDir, 'hoa_addendum.pdf')));

  doc.fontSize(14).font('Helvetica-Bold')
    .text('HOMEOWNERS ASSOCIATION ADDENDUM AND DISCLOSURE', { align: 'center' });
  doc.fontSize(9).font('Helvetica').text('Kentucky Residential Transaction', { align: 'center' });
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('TRANSACTION PARTIES:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text(`Property Address:  ${PROPERTY}`);
  doc.text(`Buyer:             ${BUYER}   |   ${BUYER_PHONE}   |   ${BUYER_EMAIL}`);
  doc.text(`Seller:            ${SELLER}`);
  doc.text(`Effective Date:    ${EFFECTIVE}`);
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('HOMEOWNERS ASSOCIATION INFORMATION:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('[X] The Property IS subject to a Homeowners Association.');
  doc.moveDown(0.3);
  doc.text('HOA Name:              Broadwater Estates Homeowners Association, Inc.');
  doc.text('Management Company:    Bluegrass Property Management LLC');
  doc.text('Management Phone:      (502) 555-0300');
  doc.text('Management Email:      info@bluegrasspm.com');
  doc.text('HOA Website:           www.broadwaterhoa.com');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('FEES AND ASSESSMENTS:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('Monthly HOA Fee:               $175.00 per month');
  doc.text('Annual Special Assessment:     None currently pending');
  doc.text('Transfer Fee (paid by Buyer):  $250.00 — due at closing');
  doc.text('Application Fee:               $75.00 — due upon HOA application');
  doc.text('Capital Contribution:          $350.00 (2 months HOA) — due at closing');
  doc.text('HOA fees current as of Effective Date: Yes — Seller confirms no delinquencies.');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('RULES AND RESTRICTIONS:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('• No short-term rentals (Airbnb, VRBO, or similar platforms) permitted');
  doc.text('• Maximum 2 domestic pets per household, weight limit 60 lbs each');
  doc.text('• No commercial vehicles, RVs, or boats parked in driveways or common areas overnight');
  doc.text('• Exterior modifications (fences, additions, paint color changes) require Architectural Committee approval');
  doc.text('• Minimum lease term: 12 months. Tenant applications must be approved by HOA.');
  doc.text('• Quiet hours: 10:00 PM – 7:00 AM');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('PENDING LITIGATION OR SPECIAL ASSESSMENTS:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('[X] Seller discloses: No pending litigation involving the HOA as of the Effective Date.');
  doc.text('[ ] There IS pending litigation (describe): ___________________________');
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text("BUYER'S RIGHT TO REVIEW HOA DOCUMENTS:");
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('Buyer has the right to receive and review: HOA Declaration of Covenants, Conditions and Restrictions (CC&Rs), Bylaws, Rules and Regulations, Budget, Reserve Fund Study, and most recent financial statements.');
  doc.moveDown(0.3);
  doc.text("Buyer's HOA Review Period: 5 days from receipt of all HOA governing documents.");
  doc.text("During this period, Buyer may cancel this Contract and receive return of Earnest Money Deposit if Buyer is not satisfied with HOA documents or financial condition.");
  doc.moveDown();

  doc.font('Helvetica-Bold').fontSize(10).text('SELLER REPRESENTATIONS:');
  doc.font('Helvetica').fontSize(9).moveDown(0.4);
  doc.text('Seller represents that all HOA assessments are current and paid through the date of closing.');
  doc.text('Seller will deliver all HOA documents to Buyer within 5 days of Effective Date.');
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(10).text('SIGNATURES:');
  doc.font('Helvetica').fontSize(9).moveDown(0.5);
  doc.text(`Buyer: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`       ${BUYER}`);
  doc.moveDown(0.5);
  doc.text(`Seller: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`        ${SELLER}`);
  doc.moveDown(0.5);
  doc.text(`Agent: ___________________________   Date: ${EFFECTIVE}`);
  doc.text(`       ${AGENT_NAME}  |  ${OFFICE_NAME}  |  License #${AGENT_LIC}  |  ${AGENT_PHONE}`);

  doc.end();
  console.log('✅ hoa_addendum.pdf generated');
}

generateLeadPaint();
generatePurchaseAgreement();
generateHOAAddendum();
