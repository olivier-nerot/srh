import pdf2html from 'pdf2html';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function convertPdfsToHtml() {
  const pdfDir = path.join(__dirname, '..', 'src', 'assets', 'pdf');
  const outputDir = path.join(__dirname, '..', 'public', 'converted-html');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const files = fs.readdirSync(pdfDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    console.log(`Found ${pdfFiles.length} PDF files to convert...`);

    for (const pdfFile of pdfFiles) {
      const pdfPath = path.join(pdfDir, pdfFile);
      const htmlFileName = pdfFile.replace('.pdf', '.html');
      const htmlPath = path.join(outputDir, htmlFileName);

      console.log(`Converting ${pdfFile}...`);

      try {
        const html = await pdf2html.html(pdfPath);
        fs.writeFileSync(htmlPath, html);
        console.log(`✓ Converted ${pdfFile} to ${htmlFileName}`);
      } catch (error) {
        console.error(`✗ Failed to convert ${pdfFile}:`, error.message);
      }
    }

    console.log('PDF conversion complete!');
  } catch (error) {
    console.error('Error during PDF conversion:', error);
  }
}

convertPdfsToHtml();