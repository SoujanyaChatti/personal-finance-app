import { extractTextFromImage, extractTextFromPDF, parseReceiptText, parseTabularPDF } from '../services/receiptService.js';
import Transaction from '../models/Transaction.js';
import path from 'path';
import fs from 'fs';
import { createWorker } from 'tesseract.js';
import { fromPath } from 'pdf2pic'; // Correct import for pdf2pic

export const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let text = '';
    if (['.jpg', '.jpeg', '.png', '.bmp'].includes(ext)) {
      text = await extractTextFromImage(req.file.path);
    } else if (ext === '.pdf') {
      // First attempt with pdf-parse for text-based PDFs
      try {
        text = await extractTextFromPDF(req.file.path);
        if (!text || text.trim().length < 10) {
          throw new Error('Insufficient text extracted, treating as scanned PDF');
        }
      } catch (pdfErr) {
        // Fallback to OCR for scanned PDFs by converting to images
        console.log('Falling back to OCR for scanned PDF:', pdfErr.message);
        const options = {
          density: 300, // Increased from 200 for better resolution
          saveFilename: 'temp',
          savePath: path.dirname(req.file.path),
          format: 'png',
          width: 1200, // Increased for better detail
          height: 1500,
          // executeOptions: { gm: '/usr/local/bin/gm' }, // Uncomment if path is needed
        };
        const convert = fromPath(req.file.path, options);
        const pageImages = await convert(1, { responseType: 'image' }); // Convert first page to image
        if (!pageImages || !pageImages.path) {
          throw new Error('Failed to convert PDF to image');
        }

        console.log('Initializing Tesseract worker with lang: eng');
        const worker = await createWorker('eng'); // Simplified to string lang
        try {
          console.log('Recognizing text from image:', pageImages.path);
          const { data: { text: ocrText } } = await worker.recognize(pageImages.path, {
            tessedit_char_whitelist: '0123456789./- :ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', // Restrict to relevant characters
          });
          console.log('Raw OCR text:', ocrText); // Debug the extracted text
          await worker.terminate();
          text = ocrText;
          console.log('Normalized text for parsing:', text); // Debug before parsing
          if (!text || text.trim().length < 10) {
            return res.status(422).json({
              error: 'OCR failed to extract meaningful text',
              extractedText: text || 'No text extracted',
              details: {
                amountExtracted: false,
                dateExtracted: false,
              },
            });
          }
        } catch (ocrErr) {
          await worker.terminate();
          throw ocrErr;
        }
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    const parsed = parseReceiptText(text);
    if (!parsed.amount || !parsed.date) {
      const fallbackDate = !parsed.date ? new Date() : null;
      return res.status(422).json({
        error: 'Could not extract amount or date from receipt.',
        extractedText: parsed.rawText,
        details: {
          amountExtracted: !!parsed.amount,
          dateExtracted: !!parsed.date,
          fallbackDate: fallbackDate ? fallbackDate.toISOString() : null,
          extractedAmount: parsed.amount,
        },
      });
    }

    if (parsed.amount < 1) {
      return res.status(422).json({
        error: 'Extracted amount is too low or invalid.',
        extractedText: parsed.rawText,
        details: {
          amountExtracted: true,
          dateExtracted: true,
          extractedAmount: parsed.amount,
        },
      });
    }

    const transaction = await Transaction.create({
      userId: req.user.userId,
      type: 'expense',
      amount: parsed.amount,
      category: parsed.category,
      date: parsed.date,
      description: 'Extracted from receipt',
    });

    res.json({ extracted: parsed, transaction });
  } catch (err) {
    console.error('Failed to process receipt:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to process receipt.', details: err.message });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }
    // Clean up temporary image files
    const tempDir = path.dirname(req.file.path);
    fs.readdir(tempDir, (err, files) => {
      if (err) console.error('Failed to read temp directory:', err);
      files?.forEach(file => {
        if (file.startsWith('temp') && file.endsWith('.png')) {
          fs.unlink(path.join(tempDir, file), (err) => {
            if (err) console.error('Failed to delete temp image:', err);
          });
        }
      });
    });
  }
};

export const uploadHistory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized: User not authenticated.' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.pdf') return res.status(400).json({ error: 'Only PDF files supported.' });

    let text = '';
    try {
      text = await extractTextFromPDF(req.file.path);
      if (!text || text.trim().length < 10) {
        throw new Error('Insufficient text extracted, treating as scanned PDF');
      }
    } catch (pdfErr) {
      console.log('Falling back to OCR for scanned PDF:', pdfErr.message);
      const options = {
        density: 300,
        saveFilename: 'temp',
        savePath: path.dirname(req.file.path),
        format: 'png',
        width: 1200,
        height: 1500,
        // executeOptions: { gm: '/usr/local/bin/gm' }, // Uncomment if path is needed
      };
      const convert = fromPath(req.file.path, options);
      const pageImages = await convert(1, { responseType: 'image' }); // Convert first page to image
      if (!pageImages || !pageImages.path) {
        throw new Error('Failed to convert PDF to image');
      }

      console.log('Initializing Tesseract worker with lang: eng');
      const worker = await createWorker('eng');
      try {
        console.log('Recognizing text from image:', pageImages.path);
        const { data: { text: ocrText } } = await worker.recognize(pageImages.path, {
          tessedit_char_whitelist: '0123456789./- :ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        });
        console.log('Raw OCR text:', ocrText);
        await worker.terminate();
        text = ocrText;
        console.log('Normalized text for parsing:', text);
        if (!text || text.trim().length < 10) {
          return res.status(422).json({
            error: 'OCR failed to extract meaningful text',
            extractedText: text || 'No text extracted',
            details: {
              amountExtracted: false,
              dateExtracted: false,
            },
          });
        }
      } catch (ocrErr) {
        await worker.terminate();
        throw ocrErr;
      }
    }

    const rows = parseTabularPDF(text);
    if (!rows.length) return res.status(422).json({ error: 'No valid transactions found in PDF.' });

    const created = [];
    for (const row of rows) {
      try {
        const { date, description, category, amount, type } = row;
        if (!date || !amount || !type) {
          console.warn('Skipping invalid transaction:', row);
          continue;
        }
        const typeMap = { debit: 'expense', credit: 'income' };
        const dbType = typeMap[type.toLowerCase()] || 'expense';
        const tx = await Transaction.create({
          userId: req.user.userId,
          type: dbType,
          amount: parseFloat(amount),
          category: category || 'Other',
          date: new Date(date),
          description: description || 'Imported from PDF',
        });
        created.push(tx);
      } catch (err) {
        console.error('Failed to insert transaction:', row, err.message);
      }
    }

    if (!created.length) {
      return res.status(422).json({ error: 'No valid transactions could be saved.' });
    }

    res.json({ count: created.length, transactions: created });
  } catch (err) {
    console.error('Failed to process PDF history:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to process PDF history.', details: err.message });
  } finally {
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }
    const tempDir = path.dirname(req.file.path);
    fs.readdir(tempDir, (err, files) => {
      if (err) console.error('Failed to read temp directory:', err);
      files?.forEach(file => {
        if (file.startsWith('temp') && file.endsWith('.png')) {
          fs.unlink(path.join(tempDir, file), (err) => {
            if (err) console.error('Failed to delete temp image:', err);
          });
        }
      });
    });
  }
};