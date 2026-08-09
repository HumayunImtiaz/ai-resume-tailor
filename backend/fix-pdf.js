 const fs = require('fs');
const file = 'src/services/pdf.service.ts';
let content = fs.readFileSync(file, 'utf8');

const sanitizeFn = `
function sanitizeForPdf(text: string): string {
  if (!text) return text;
  return text
    .replace(/→/g, '-')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/…/g, '...')
    // Strip any remaining characters outside the basic WinAnsi-safe range
    .replace(/[^\\x00-\\xFF]/g, '');
}

`;

// Inject sanitize function
content = content.replace("export interface StructuredResume", sanitizeFn + "export interface StructuredResume");

// Inject wrapper inside generateResumePdf
const wrapperFn = `
    const drawSanitizedText = (p: any, text: string, options: any) => {
      p.drawText(sanitizeForPdf(text), options);
    };

    const getSanitizedWidth = (font: any, text: string, size: number) => {
      return font.widthOfTextAtSize(sanitizeForPdf(text), size);
    };
`;
content = content.replace("const rgbColor = ", wrapperFn + "\\n    const rgbColor = ");

// Replace page.drawText( to drawSanitizedText(page, 
content = content.replace(/page\.drawText\(/g, 'drawSanitizedText(page, ');

// Replace font.widthOfTextAtSize(text, size)
content = content.replace(/font\.widthOfTextAtSize\(([^,]+),\s*([^)]+)\)/g, 'getSanitizedWidth(font, $1, $2)');
content = content.replace(/helveticaBold\.widthOfTextAtSize\(([^,]+),\s*([^)]+)\)/g, 'getSanitizedWidth(helveticaBold, $1, $2)');
content = content.replace(/helveticaFont\.widthOfTextAtSize\(([^,]+),\s*([^)]+)\)/g, 'getSanitizedWidth(helveticaFont, $1, $2)');
content = content.replace(/helveticaOblique\.widthOfTextAtSize\(([^,]+),\s*([^)]+)\)/g, 'getSanitizedWidth(helveticaOblique, $1, $2)');

fs.writeFileSync(file, content);
console.log('Done');
