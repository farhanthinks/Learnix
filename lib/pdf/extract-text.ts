import { PDFParse } from "pdf-parse";

const MAX_CHARS = 20000; // keeps the Groq prompt + response comfortably within context limits
const MIN_TEXT_LENGTH = 40; // below this, treat the PDF as scanned/image-only

export interface ExtractTextResult {
  text?: string;
  truncated?: boolean;
  error?: string;
}

export async function extractSyllabusText(buffer: Buffer): Promise<ExtractTextResult> {
  let parser: PDFParse;
  try {
    parser = new PDFParse({ data: buffer });
  } catch (err) {
    console.error("[extractSyllabusText] PDFParse construction failed:", err);
    return {
      error: "This PDF appears to be corrupted or unreadable. Please try a different file.",
    };
  }

  try {
    const result = await parser.getText({ pageJoiner: "\n" });
    const text = (result.text ?? "").replace(/\s+/g, " ").trim();

    if (text.length < MIN_TEXT_LENGTH) {
      return {
        error:
          "This PDF appears to be scanned/image-based. Please upload a text-based syllabus PDF.",
      };
    }

    if (text.length > MAX_CHARS) {
      return { text: text.slice(0, MAX_CHARS), truncated: true };
    }

    return { text };
  } catch (err) {
    console.error("[extractSyllabusText] getText failed:", err);
    return {
      error: "This PDF appears to be corrupted or unreadable. Please try a different file.",
    };
  } finally {
    await parser.destroy();
  }
}
