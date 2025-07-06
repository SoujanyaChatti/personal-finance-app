import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import fs from 'fs';
// Utility function to normalize text (preserve single spaces for table parsing)
function normalizeText(text) {
  return text
    .replace(/\n+/g, '\n') // Preserve single newlines
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces to single
    .trim();
}

// Utility function to parse various date formats
import { parse } from 'date-fns'; // Add date-fns for robust date parsing

// Utility function to parse various date formats
function parseDateFromText(text) {
  const datePatterns = [
    { pattern: /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/, format: 'dd/MM/yyyy' }, // e.g., 12/31/2023
    { pattern: /\b(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/, format: 'yyyy/MM/dd' }, // e.g., 2023-12-31, 2021/02/25
    { pattern: /\b(\d{8})\b/, format: 'yyyyMMdd' }, // e.g., 20231231
    { pattern: /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i, format: 'dd MMM yyyy' }, // e.g., 31 Dec 2023
    { pattern: /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+\d{2,4})\b/i, format: 'MMM dd, yyyy' }, // e.g., Dec 31, 2023
    { pattern: /\b(\d{1,2}[\/\-.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\/\-.]\d{2,4})\b/i, format: 'dd/MMM/yyyy' }, // e.g., 31/Dec/2023
    { pattern: /\b(\d{1,2}-[A-Za-z]{3}-\d{2,4})\b/, format: 'dd-MMM-yy' }, // e.g., 31-Dec-23
    { pattern: /(?:Date\s*:?\s*)(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s+\d{1,2}:\d{2}:\d{2})?/, format: 'dd/MM/yyyy' }, // e.g., Date:27/05/2016
  ];

  console.log('Attempting to parse date from text:', text);

  for (const { pattern, format } of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let dateStr = match[1];
      console.log(`Matched date pattern: ${pattern}, extracted: ${dateStr}, format: ${format}`);
      try {
        // Normalize separators for consistency
        dateStr = dateStr
          .replace(/-/g, '/')
          .replace(/\./g, '/')
          .replace(/(\d{1,2})(st|nd|rd|th)/i, '$1')
          .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/i, (m) => m.slice(0, 3));
        const parsedDate = parse(dateStr, format, new Date());
        if (!isNaN(parsedDate.getTime())) {
          console.log(`Parsed date: ${parsedDate}`);
          return parsedDate;
        }
        console.warn(`Invalid date format after parsing: ${dateStr}`);
      } catch (error) {
        console.warn(`Failed to parse date: ${dateStr}`, error);
      }
    }
  }

  console.warn('No valid date found in text:', text);
  return null;
}
// Utility function to parse amounts with currency symbols
function parseAmountFromText(text) {
  const amountPatterns = [
    // Prioritize "total" explicitly
    /\b(?:total)\s*[:=~]?\s*([£€$]?\s*[\d]+(?:\.\d{1,2})?)\b/gi,
    // Then "amount", "sale", "subtotal"
    /\b(?:amount|sale|subtotal)\s*[:=~]?\s*([£€$]?\s*[\d]+(?:\.\d{1,2})?)\b/gi,
    // Fallback for standalone numbers with decimals
    /\b([£€$]?\s*[\d]+(?:\.\d{1,2})?)\b/g,
  ];

  console.log('Attempting to parse amount from text:', text);

  const taxes = Array.from(text.matchAll(/tax\s*[:=~]?\s*([£€$]?\s*[\d]+(?:\.\d{1,2})?)/gi)).map(
    (m) => parseFloat(m[1].replace(/,/g, '').replace(/[£€$]/g, '').trim())
  ).filter(n => !isNaN(n));

  const allMatches = [];
  for (const pattern of amountPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      let amountStr = match[1].replace(/,/g, '').replace(/[£€$]/g, '').trim();
      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        allMatches.push({ amount, source: match[0] });
      }
    }
  }

  if (allMatches.length) {
    // Prioritize "total", then "amount/sale/subtotal"
    const prioritized = allMatches.find((m) => /total/i.test(m.source)) ||
                       allMatches.find((m) => /amount|sale|subtotal/i.test(m.source)) ||
                       allMatches[0];
    console.log(`Extracted amount: ${prioritized.amount} from source: ${prioritized.source}`);

    // Validate against tax if present
    if (taxes.length) {
      const totalWithTax = allMatches.find((m) => Math.abs(m.amount - (prioritized.amount + taxes.reduce((sum, t) => sum + t, 0))) < 0.01);
      if (totalWithTax) {
        console.log(`Validated amount with tax: ${totalWithTax.amount}`);
        return totalWithTax.amount;
      }
    }

    return prioritized.amount;
  }

  // Fallback: largest number with decimal point
  const allNumbers = Array.from(text.matchAll(/([\d]+(?:\.\d{1,2})?)/g))
    .map((m) => parseFloat(m[1]))
    .filter((n) => !isNaN(n) && n >= 1);
  if (allNumbers.length) {
    const maxAmount = Math.max(...allNumbers);
    console.log(`Fallback amount: ${maxAmount}`);
    return maxAmount;
  }

  console.warn('No valid amount found in text:', text);
  return null;
}

// Utility function to infer category based on keywords (used as fallback)
function inferCategory(text) {
  const categoryKeywords = {
    Groceries: ['grocery', 'supermarket', 'food', 'market'],
    Dining: ['restaurant', 'cafe', 'dining', 'food', 'swiggy'],
    Transport: ['fuel', 'gas', 'taxi', 'uber', 'train', 'bus'],
    Retail: ['store', 'shop', 'clothing', 'electronics', 'amazon'],
    Gift: ['gift'],
    Other: [], // Default category
  };

  const normalizedText = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      return category;
    }
  }
  return 'Other';
}

export async function extractTextFromImage(file) {
  try {
    // Validate input
    if (!file) {
      throw new Error('No file provided for image extraction');
    }

    // Use Tesseract.js to extract text from image
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => console.log(`OCR Progress: ${m.status} ${Math.round(m.progress * 100)}%`),
    });

    if (!text) {
      throw new Error('No text extracted from image');
    }

    return normalizeText(text);
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

export async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    if (!fullText.trim()) {
      throw new Error('No text extracted from PDF');
    }
    
    console.log('Extracted PDF text:', fullText);
    return normalizeText(fullText);
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

export function parseReceiptText(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for receipt parsing');
    }

    const normalizedText = normalizeText(text);
    console.log('Normalized text for parsing:', normalizedText);

    const amount = parseAmountFromText(normalizedText);
    const date = parseDateFromText(normalizedText);
    const category = inferCategory(normalizedText);

    if (!amount) {
      console.warn('Could not extract amount from receipt text:', normalizedText);
    }
    if (!date) {
      console.warn('Could not extract date from receipt text:', normalizedText);
    }

    return {
      amount: amount || null,
      date: date || null,
      category: category || 'Other',
      rawText: normalizedText,
    };
  } catch (error) {
    console.error('Error parsing receipt text:', error, 'Text:', text);
    throw new Error(`Failed to parse receipt text: ${error.message}`);
  }
}
export function parseTabularPDF(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for tabular PDF parsing');
    }

    const lines = text.split('\n').map(line => normalizeText(line)).filter(line => line);
    const transactions = [];

    // Updated regex to handle spaces and more flexible formats
    const tableRowPattern = /^(\d{4}-\d{2}-\d{2})\s*(\w+)\s*([A-Za-z]+)\s*([\d,.]+)\s*(debit|credit)$/i;

    const headerPatterns = [/^Table\s+\d+$/i, /^Date\s*Description\s*Category\s*Amount\s*Type$/i, /^\d+$/];

    for (const line of lines) {
      if (headerPatterns.some(pattern => pattern.test(line))) {
        continue;
      }

      const match = line.match(tableRowPattern);
      if (match) {
        const date = parseDateFromText(match[1]);
        const description = match[2].trim();
        const category = match[3].trim();
        const amount = parseFloat(match[4].replace(/,/g, '').replace(/[£€$]/, ''));
        const type = match[5].toLowerCase();

        if (!isNaN(amount) && date && ['debit', 'credit'].includes(type)) {
          transactions.push({
            date,
            description,
            category,
            amount,
            type,
          });
        } else {
          console.warn(`Invalid transaction in line: ${line}`);
        }
      } else {
        console.warn(`Line does not match table pattern: ${line}`);
      }
    }

    // Fallback parsing for space-separated rows
    if (transactions.length === 0) {
      for (const line of lines) {
        if (headerPatterns.some(pattern => pattern.test(line))) {
          continue;
        }
        const parts = line.split(/\s+/);
        if (parts.length >= 5) {
          const date = parseDateFromText(parts[0]);
          const amount = parseAmountFromText(parts[parts.length - 2]);
          const type = parts[parts.length - 1].toLowerCase();
          if (date && !isNaN(amount) && ['debit', 'credit'].includes(type)) {
            const description = parts.slice(1, -3).join(' ');
            const category = parts[parts.length - 3];
            transactions.push({
              date,
              description,
              category,
              amount,
              type,
            });
          }
        }
      }
    }

    if (transactions.length === 0) {
      console.warn('No valid transactions extracted from PDF');
    } else {
      console.log(`Extracted ${transactions.length} transactions`);
    }

    return transactions;
  } catch (error) {
    console.error('Error parsing tabular PDF:', error);
    throw new Error(`Failed to parse tabular PDF: ${error.message}`);
  }
}
export function processTransactions(transactions) {
  try {
    if (!transactions || !Array.isArray(transactions)) {
      throw new Error('Invalid transactions input');
    }

    const processedTransactions = [];

    for (const tx of transactions) {
      if (!tx.date || !tx.amount || !tx.type) {
        console.error('Skipping invalid transaction:', tx);
        continue;
      }

      processedTransactions.push(tx);
    }

    return processedTransactions;
  } catch (error) {
    console.error('Error processing transactions:', error);
    throw new Error(`Failed to process transactions: ${error.message}`);
  }
}



process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});