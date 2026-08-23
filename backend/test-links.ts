import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString, PDFHexString } from 'pdf-lib';

async function run() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([100, 100]);
    // add an annot
    const ref = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [0, 0, 10, 10],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: 'https://test.com/link?a=b' }
    });
    let annots = page.node.Annots();
    if (!annots) {
      annots = pdfDoc.context.obj([]);
      page.node.set(pdfDoc.context.obj('Annots'), annots);
    }
    annots.push(ref);

    const saved = await pdfDoc.save();
    
    // Now load it
    const loaded = await PDFDocument.load(saved);
    const loadedPages = loaded.getPages();
    for (const p of loadedPages) {
      const pAnnots = p.node.Annots();
      if (pAnnots instanceof PDFArray) {
        for (let i = 0; i < pAnnots.size(); i++) {
          const dict = pAnnots.lookup(i, PDFDict);
          if (dict) {
            const subtype = dict.lookup(PDFName.of('Subtype'), PDFName);
            if (subtype && subtype.encodedName === '/Link') {
              const a = dict.lookup(PDFName.of('A'), PDFDict);
              if (a) {
                const s = a.lookup(PDFName.of('S'), PDFName);
                if (s && s.encodedName === '/URI') {
                  const uri = a.get(PDFName.of('URI'));
                  let decoded = '';
                  if (uri instanceof PDFString) {
                    decoded = uri.decodeText();
                  } else if (uri instanceof PDFHexString) {
                    decoded = uri.decodeText();
                  }
                  console.log('Found URI:', decoded);
                }
              }
            }
          }
        }
      }
    }
  } catch(e) {
    console.error(e);
  }
}

run();
