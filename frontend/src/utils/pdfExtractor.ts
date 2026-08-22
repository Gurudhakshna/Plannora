import * as pdfjsLib from "pdfjs-dist";

// Configure worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  charCount: number;
}

interface PDFTextItem {
  str?: string;
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
        .map((item: PDFTextItem | unknown) => {
          if (item && typeof item === "object" && "str" in item && typeof (item as PDFTextItem).str === "string") {
            return (item as PDFTextItem).str;
          }
          return "";
        })
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
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("OCR")) {
      throw err;
    }
    throw new Error(
      "This PDF does not contain extractable text. OCR is required for scanned/image-only PDFs.",
      { cause: err }
    );
  }
}
