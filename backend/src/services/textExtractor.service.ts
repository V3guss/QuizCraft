import fs from 'fs';
import path from 'path';

/**
 * Extract text content from various document formats.
 * Output is plain text where headings / slide titles are emitted as Markdown "## " lines so the
 * summarizer can follow the document structure.
 */
export class TextExtractorService {
  /**
   * Extract text from a file based on its extension
   */
  static async extractText(filePath: string, fileType: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    let text: string;
    switch (ext) {
      case '.pdf':
        text = await this.extractFromPDF(filePath);
        break;
      case '.docx':
        text = await this.extractFromDOCX(filePath);
        break;
      case '.pptx':
        text = await this.extractFromPPTX(filePath);
        break;
      case '.txt':
        text = await this.extractFromTXT(filePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
    return this.clean(text);
  }

  /** Normalise whitespace, drop control chars and re-join words hyphenated across lines. */
  private static clean(text: string): string {
    return text
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/(\w)-\n(\w)/g, '$1$2')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extract text from PDF files (page by page, so large documents keep their order)
   */
  private static async extractFromPDF(filePath: string): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pages: string[] = [];
      const data = await pdfParse(dataBuffer, {
        pagerender: async (pageData: any) => {
          const content = await pageData.getTextContent({ normalizeWhitespace: true });
          let lastY: number | undefined;
          let line = '';
          for (const item of content.items) {
            const y = item.transform[5];
            if (lastY !== undefined && Math.abs(y - lastY) > 2) line += '\n';
            line += item.str;
            lastY = y;
          }
          pages.push(line);
          return line;
        },
      });
      return pages.length ? pages.join('\n\n') : data.text || '';
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF file.');
    }
  }

  /**
   * Extract text from DOCX files (headings and lists preserved as Markdown)
   */
  private static async extractFromDOCX(filePath: string): Promise<string> {
    try {
      const mammoth = require('mammoth');
      try {
        const md = await mammoth.convertToMarkdown({ path: filePath });
        if (md.value && md.value.trim()) {
          return md.value
            .replace(/\\([.\-*_#()\[\]])/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/\*\*([^*]+)\*\*/g, '$1');
        }
      } catch {
        /* fall back to raw text */
      }
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error('Failed to extract text from DOCX file.');
    }
  }

  /**
   * Extract text from PPTX files slide by slide (title becomes a "## " heading, speaker notes included)
   */
  private static async extractFromPPTX(filePath: string): Promise<string> {
    try {
      const JSZip = require('jszip');
      const zip = await JSZip.loadAsync(fs.readFileSync(filePath));

      const num = (name: string) => parseInt(name.match(/(\d+)\.xml$/)?.[1] || '0', 10);
      const slideNames = Object.keys(zip.files)
        .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
        .sort((a, b) => num(a) - num(b));

      const paragraphs = (xml: string): string[] => {
        const out: string[] = [];
        for (const p of xml.match(/<a:p[ >][\s\S]*?<\/a:p>/g) || []) {
          const t = (p.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [])
            .map((x) => x.replace(/<[^>]+>/g, ''))
            .join('');
          const clean = this.decodeXml(t).trim();
          if (clean) out.push(clean);
        }
        return out;
      };

      const slides: string[] = [];
      for (const name of slideNames) {
        const xml = await zip.file(name).async('string');
        const lines = paragraphs(xml);
        const noteFile = zip.file(`ppt/notesSlides/notesSlide${num(name)}.xml`);
        const notes = noteFile ? paragraphs(await noteFile.async('string')).filter((l) => !/^\d+$/.test(l)) : [];
        if (!lines.length && !notes.length) continue;
        const [title, ...body] = lines;
        slides.push(
          [`## ${title ?? `Slide ${num(name)}`}`, ...body.map((l) => `- ${l}`), ...(notes.length ? ['Notes:', ...notes] : [])].join('\n')
        );
      }
      if (slides.length) return slides.join('\n\n');

      const officeparser = require('officeparser');
      return (await officeparser.parseOfficeAsync(filePath)) || '';
    } catch (error) {
      console.error('Error extracting text from PPTX:', error);
      throw new Error('Failed to extract text from PPTX file.');
    }
  }

  private static decodeXml(s: string): string {
    return s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&amp;/g, '&');
  }

  /**
   * Extract text from TXT files
   */
  private static async extractFromTXT(filePath: string): Promise<string> {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading TXT file:', error);
      throw new Error('Failed to read TXT file.');
    }
  }
}
