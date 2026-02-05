
import { Capacitor } from '@capacitor/core';
import { Transaction } from '../types';

// Global SMS object from cordova-plugin-sms
declare global {
  interface Window {
    SMS?: {
      listSMS: (filter: any, success: (data: any[]) => void, fail: (err: any) => void) => void;
      hasPermission: (success: (hasPermission: boolean) => void, fail: (err: any) => void) => void;
      requestPermission: (success: () => void, fail: (err: any) => void) => void;
    };
  }
}

export interface SmsMessage {
  id: number;
  threadId: number;
  body: string;
  address: string; // Sender ID
  date: number; // Timestamp
}

export const checkSmsPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  if (window.SMS) {
      return new Promise((resolve) => {
        window.SMS!.hasPermission((hasPermission: boolean) => resolve(hasPermission), () => resolve(false));
      });
  }
  return false;
};

export const requestSmsPermission = async (): Promise<boolean> => {
    if (window.SMS) {
        return new Promise((resolve) => {
            window.SMS!.requestPermission(() => resolve(true), () => resolve(false));
        });
    }
    return true; 
};

export const readRecentSms = async (limit: number = 200): Promise<SmsMessage[]> => {
  if (!Capacitor.isNativePlatform()) return [];
  const hasPermission = await checkSmsPermission();
  if (!hasPermission) {
      const granted = await requestSmsPermission();
      if (!granted) throw new Error("SMS permission denied.");
  }

  return new Promise((resolve, reject) => {
    if (window.SMS) {
      window.SMS.listSMS({ box: 'inbox', indexFrom: 0, maxCount: limit }, 
        (data: any) => resolve(Array.isArray(data) ? data : []), 
        (err: any) => reject(new Error("SMS Plugin Error: " + JSON.stringify(err)))
      );
      return;
    }
    const capacitorSms = (window as any).Capacitor?.Plugins?.SmsInbox;
    if (capacitorSms) {
        capacitorSms.getMessages({ count: limit, box: 'inbox' })
            .then((res: any) => resolve(res?.messages || res || []))
            .catch(reject);
        return;
    }
    reject(new Error("No SMS plugin detected."));
  });
};

// --- Advanced Parsing Logic (Ported from ExpensesRepository.kt) ---

const BANK_SENDER_IDS = [
    "TMB", "QNB", "QIB", "CBQ", "Doha Bank", "HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "PAYTM",
    "BOB", "IDFC", "PNB", "UBI", "CANARA", "INDUS", "YES", "RBL", "UNION", "BOI",
    "CITI", "HSBC", "SC", "AMEX", "CHASE", "BOA", "WELLS", "CASH"
];

const KEYWORDS = ["purchase", "transaction", "spent", "debited", "charged", "paid", "sent", "withdrawal", "credited", "received", "deposited", "refund", "added"];
const IGNORE_WORDS = ["OTP", "login", "bonus", "verification", "requested", "failed", "declined", "due", "request"];

const PATTERNS = {
    amount: /(?:(?:Rs|INR|₹|QAR|USD|EUR|GBP|AED|SAR)\.?\s?)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i,
    debit: /(debited|spent|withdrawn|paid|sent|purchase|transferred\s+to|txn\s+of)/i,
    credit: /(credited|received|deposited|refund|added|returned)/i,
    merchantAt: /(?:at|@)\s+([A-Za-z0-9\s&-\.]+?)(?:\s+(?:on|from|date|for)|\.|$)/i,
    merchantTo: /(?:to|paid)\s+([A-Za-z0-9\s&-\.]+?)(?:\s+(?:on|from|date)|\.|$)/i,
    merchantVia: /(?:via|through)\s+([A-Za-z0-9\s&-\.]+?)(?:\s+(?:on|from|date)|\.|$)/i,
    upi: /([a-zA-Z0-9.\-_]+@[a-zA-Z]+)/,
    modeUpi: /UPI/i,
    modeCard: /(?:credit|debit)?\s?card/i,
    modeAtm: /atm/i,
    modeNetbanking: /(?:net\s?banking|imps|neft|rtgs)/i,
    // TMB specific pattern for "Your A/c No.XXXX..."
    tmbAccount: /Your\s+A\/c\s+No\.([xX]*\d{4})/i
};

const containsAny = (str: string, keywords: string[]): boolean => keywords.some(k => str.toLowerCase().includes(k.toLowerCase()));

const categorizeMerchant = (merchant: string): string => {
    const lower = merchant.toLowerCase();
    if (containsAny(lower, ["swiggy", "zomato", "food", "restaurant", "cafe", "pizza", "burger", "talabat", "deliveroo", "kfc", "dominos", "mcdonalds", "starbucks", "coffee", "bakery", "kitchen"])) return 'Food';
    if (containsAny(lower, ["uber", "ola", "fuel", "petrol", "pump", "metro", "rail", "karwa", "taxi", "cab", "transport", "airlines", "air", "flight", "irctc", "shell", "woqod"])) return 'Transportation';
    if (containsAny(lower, ["amazon", "flipkart", "myntra", "retail", "mart", "shop", "store", "lulu", "carrefour", "mall", "fashion", "clothing", "apparel", "nike", "adidas", "zara", "h&m", "trends", "pantaloons"])) return 'Shopping';
    if (containsAny(lower, ["grocery", "supermarket", "market", "fresh", "basket", "bigbasket", "blinkit", "zepto", "instamart"])) return 'Shopping';
    if (containsAny(lower, ["netflix", "spotify", "movie", "cinema", "prime", "youtube", "hotstar", "bookmyshow", "pvr", "inox", "entertainment", "game", "playstation", "steam"])) return 'Entertainment';
    if (containsAny(lower, ["pharmacy", "med", "hospital", "clinic", "doctor", "lab", "health", "apollo", "1mg", "pharmeasy"])) return 'Healthcare';
    if (containsAny(lower, ["bill", "electricity", "recharge", "broadband", "wifi", "jio", "airtel", "vi", "vodafone", "bsnl", "ooredoo", "power", "water", "gas", "bescom", "insurance", "lic"])) return 'Utilities';
    if (containsAny(lower, ["salary", "interest", "dividend", "cash deposit", "neft in"])) return 'Other'; 
    return 'Other';
};

const cleanMerchantName = (raw: string): string => {
    let cleaned = raw.replace(/^(?:UPI|IMPS|NEFT|RTGS|ATM|POS|VPS|IPS)-?/i, "").trim();
    cleaned = cleaned.split(/(?:\s+(?:on|ref|txn|val|dated|info)\s+)/i)[0];
    if (/^\d+$/.test(cleaned) || cleaned.length < 2) return "Unknown Merchant";
    if (cleaned.length > 20) cleaned = cleaned.substring(0, 20).trim() + "...";
    return cleaned || "Unknown Merchant";
};

export const parseBankingSms = (message: SmsMessage): Partial<Transaction> | null => {
    const body = message.body;
    const sender = message.address;
    if (containsAny(body, IGNORE_WORDS)) return null;
    const isBank = BANK_SENDER_IDS.some(id => sender.toUpperCase().includes(id)) || /^[A-Z]{2}-?[A-Z0-9]{6}$/.test(sender.toUpperCase());
    if (!isBank && !containsAny(body, KEYWORDS)) return null;
    const amountMatch = body.match(PATTERNS.amount);
    if (!amountMatch) return null;
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(amount)) return null;
    const isCredit = PATTERNS.credit.test(body);
    const isDebit = PATTERNS.debit.test(body);
    const type: 'credit' | 'debit' = (isCredit && !isDebit) ? 'credit' : 'debit';
    let merchant = "Unknown";
    const merchantMatch = body.match(PATTERNS.merchantAt) || body.match(PATTERNS.merchantTo) || body.match(PATTERNS.merchantVia);
    if (merchantMatch) merchant = cleanMerchantName(merchantMatch[1]);
    else {
        const upiMatch = body.match(PATTERNS.upi);
        if (upiMatch) merchant = upiMatch[1];
        else merchant = sender.includes("-") ? sender.split("-")[1].replace(/[0-9]/g, "") : sender.replace(/[0-9]/g, "");
    }
    let payment_method: any = 'Other';
    if (PATTERNS.modeUpi.test(body)) payment_method = 'UPI';
    else if (PATTERNS.modeCard.test(body)) payment_method = 'Credit Card';
    else if (PATTERNS.modeAtm.test(body)) payment_method = 'Cash';
    else if (PATTERNS.modeNetbanking.test(body)) payment_method = 'Bank Transfer';
    const date = new Date(message.date);
    return {
        is_transaction: true, amount, type, merchant, category: categorizeMerchant(merchant),
        date: date.toISOString().split('T')[0], time: date.toTimeString().slice(0, 5),
        payment_method, raw_sms: body, createdAt: date
    };
};
