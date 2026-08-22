import * as pdfjsLib from "pdfjs-dist";

// Configure worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  charCount: number;
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => (typeof item.str === "string" ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n\n";
    }

    const cleanText = fullText.replace(/\s+/g, " ").trim();

    if (cleanText.length < 30) {
      throw new Error(
        "This PDF does not contain extractable text. OCR is required for scanned/image-only PDFs."
      );
    }

    return {
      text: cleanText,
      pageCount: pdf.numPages,
      charCount: cleanText.length,
    };
  } catch (err: any) {
    if (err.message && err.message.includes("OCR")) {
      throw err;
    }
    throw new Error(
      "This PDF does not contain extractable text. OCR is required for scanned/image-only PDFs."
    );
  }
}
