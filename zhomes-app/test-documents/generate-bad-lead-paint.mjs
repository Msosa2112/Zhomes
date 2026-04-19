/**
 * Genera un Lead Paint Disclosure CON ERRORES INTENCIONALES para probar
 * que la IA lo rechaza correctamente:
 *
 * Errores incluidos:
 *  1. Año de construcción de 2010 (posterior a 1978 → NO requiere divulgación)
 *  2. Casilla de reconocimiento del comprador NO marcada (falta firma del EPA pamphlet)
 *  3. Firma del comprador ausente (línea en blanco)
 *  4. Firma del agente ausente
 *  5. Propiedad diferente a la en transacción (dirección incorrecta)
 */
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputDir = './test-documents';

const doc = new PDFDocument({ margin: 60 });
doc.pipe(fs.createWriteStream(path.join(outputDir, 'lead_paint_BAD.pdf')));

doc.fontSize(14).font('Helvetica-Bold')
  .text('DISCLOSURE OF INFORMATION ON LEAD-BASED PAINT AND/OR LEAD-BASED PAINT HAZARDS', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(9).font('Helvetica').text('Pursuant to 42 U.S.C. § 4852d and 40 CFR Part 745', { align: 'center' });
doc.moveDown();

doc.font('Helvetica-Bold').fontSize(10).text('PROPERTY INFORMATION:');
doc.font('Helvetica').fontSize(9).moveDown(0.4);
// ERROR 1: Dirección incorrecta (diferente a la transacción)
doc.text('Property Address: 123 Fake Street, Louisville, KY 40202');
doc.text('County: Jefferson County, State: Kentucky');
// ERROR 2: Año de construcción 2010 (posterior a 1978 → disclosura NO requerida legalmente)
doc.text('Year Built: 2010 — Lead Paint Disclosure may not be required');
doc.moveDown();

doc.font('Helvetica-Bold').fontSize(10).text("SELLER'S DISCLOSURE");
doc.font('Helvetica').fontSize(9).moveDown(0.4);
doc.text('Seller: Ernesto Cougil');
doc.moveDown(0.3);
doc.text('(a) Presence of lead-based paint (check one):');
doc.moveDown(0.2);
// ERROR 3: Ambas opciones NO marcadas (incompleto)
doc.text('  [ ] Known lead-based paint hazards are present.');
doc.text('  [ ] Seller has no knowledge of lead-based paint hazards.');
doc.moveDown(0.3);
doc.text('(b) Records and reports (check one):');
// ERROR 4: Tampoco marcado
doc.text('  [ ] Seller has provided all available records.');
doc.text('  [ ] Seller has no reports or records.');
doc.moveDown();

doc.font('Helvetica-Bold').fontSize(10).text("BUYER'S ACKNOWLEDGMENT");
doc.font('Helvetica').fontSize(9).moveDown(0.4);
doc.text('Buyer: Miguel Sosa');
doc.moveDown(0.3);
// ERROR 5: No se confirma haber recibido el folleto de la EPA
doc.text('(c) Buyer has received copies of all information listed above.');
doc.text('(d) [  ] Buyer has received the EPA pamphlet "Protect Your Family From Lead In Your Home". ← NOT CHECKED');
doc.text('(e) Buyer has NOT been given a 10-day opportunity to inspect. Buyer waived inspection period.');
doc.moveDown();

doc.font('Helvetica-Bold').fontSize(10).text("AGENT'S ACKNOWLEDGMENT");
doc.font('Helvetica').fontSize(9).moveDown(0.4);
doc.text('Listing Agent: Gilbert Zaldivar  |  License #: 216658  |  Office: ZHomes Real Estate');
doc.moveDown(0.5);

doc.font('Helvetica-Bold').fontSize(10).text('CERTIFICATION OF ACCURACY');
doc.font('Helvetica').fontSize(9).moveDown(0.4);
doc.text('The following parties have reviewed the information above and certify its accuracy.');
doc.moveDown(1);

// ERROR 6: Firma del vendedor falta (línea vacía sin nombre)
doc.text('Seller: ___________________________   Date: ___________  ← UNSIGNED');
doc.moveDown(0.5);
// ERROR 7: Firma del comprador falta también
doc.text('Buyer: ___________________________   Date: ___________  ← UNSIGNED');
doc.moveDown(0.5);
doc.text('Agent: ___________________________   Date: April 19, 2026');
doc.text('       Gilbert Zaldivar  |  ZHomes Real Estate');

doc.end();
console.log('✅ lead_paint_BAD.pdf generated (with intentional errors for AI rejection test)');
