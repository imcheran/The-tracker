
/*
 * Copyright 2024 Atick Faisal
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dev.atick.sms.repository

import dev.atick.sms.data.Sms
import dev.atick.storage.room.data.models.Transaction
import javax.inject.Inject
import java.util.Locale

interface ExpensesRepository {
    suspend fun getExpenses(messages: List<Sms>): List<Transaction>
}

class ExpensesRepositoryImpl @Inject constructor() : ExpensesRepository {

    // Banks commonly used (Expanded)
    private val BANK_SENDER_IDS = listOf(
        "QNB", "QIB", "CBQ", "Doha Bank", "HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "PAYTM",
        "BOB", "IDFC", "PNB", "UBI", "CANARA", "INDUS", "YES", "RBL", "UNION", "BOI",
        "CITI", "HSBC", "SC", "AMEX", "CHASE", "BOA", "WELLS", "CASH"
    )

    // Keywords identifying transactions
    private val KEYWORDS = listOf(
        "purchase", "transaction", "spent", "debited", "charged", "paid", "sent", "withdrawal",
        "credited", "received", "deposited", "refund", "added"
    )

    // Ignore words (OTP, Login, etc)
    private val IGNORE_WORDS = listOf(
        "OTP", "login", "bonus", "verification", "requested", "failed", "declined", "due", "request"
    )

    private val PATTERNS = object {
        // Amount: Matches strings like "Rs. 1,234.50", "INR 1234", "USD 12.00".
        // Improved to avoid capturing years like "2024" by requiring currency symbol or decimals often.
        val amount = Regex("(?i)(?:(?:Rs|INR|₹|QAR|USD|EUR|GBP|AED|SAR)\\.?\\s?)(\\d{1,3}(?:,\\d{3})*(?:\\.\\d{1,2})?)")

        // Debit indicators
        val debit = Regex("(?i)(debited|spent|withdrawn|paid|sent|purchase|transferred\\s+to|txn\\s+of)")

        // Credit indicators
        val credit = Regex("(?i)(credited|received|deposited|refund|added|returned)")

        // Merchant patterns - look for "at/to/via [Merchant]"
        // Captures text after 'at', 'to', 'via' until 'on', 'from', 'date', or end of line.
        val merchantAt = Regex("(?i)(?:at|@)\\s+([A-Za-z0-9\\s&-\\.]+?)(?:\\s+(?:on|from|date|for)|\\.|$)")
        val merchantTo = Regex("(?i)(?:to|paid)\\s+([A-Za-z0-9\\s&-\\.]+?)(?:\\s+(?:on|from|date)|\\.|$)")
        val merchantVia = Regex("(?i)(?:via|through)\\s+([A-Za-z0-9\\s&-\\.]+?)(?:\\s+(?:on|from|date)|\\.|$)")

        // UPI ID Pattern (e.g., example@upi)
        val upi = Regex("([a-zA-Z0-9.\\-_]+@[a-zA-Z]+)")

        // Payment Mode
        val modeUpi = Regex("(?i)UPI")
        val modeCard = Regex("(?i)(?:credit|debit)?\\s?card")
        val modeAtm = Regex("(?i)atm")
        val modeNetbanking = Regex("(?i)(?:net\\s?banking|imps|neft|rtgs)")
    }

    override suspend fun getExpenses(messages: List<Sms>): List<Transaction> {
        val transactions = mutableListOf<Transaction>()

        for (message in messages) {
            val body = message.body ?: continue
            val sender = message.address ?: continue

            // 1. Basic Filter: Must look like a bank transaction
            val isBankSender = isBankSms(sender)
            val hasKeyword = KEYWORDS.any { body.contains(it, ignoreCase = true) }
            val hasIgnoreWord = IGNORE_WORDS.any { body.contains(it, ignoreCase = true) }

            if (hasIgnoreWord) continue
            // Stricter check: If not a known bank sender, must have strong transaction keywords
            if (!isBankSender && !hasKeyword) continue

            // 2. Extract Amount (Crucial)
            val amountMatch = PATTERNS.amount.find(body) ?: continue
            val amountString = amountMatch.groupValues[1].replace(",", "")
            val amount = amountString.toDoubleOrNull() ?: continue

            // 3. Extract Type
            // Check for credit keywords specifically
            val isCredit = PATTERNS.credit.containsMatchIn(body)
            val isDebit = PATTERNS.debit.containsMatchIn(body)
            
            // Default to debit if "debited" is present, or if it's ambiguous but not explicitly credit
            val type = if (isCredit && !isDebit) "credit" else "debit"

            // 4. Extract Merchant
            var merchant = "Unknown"

            // Strategy: Look for "at/to merchant", then UPI ID, then Sender Name
            val merchantMatch = PATTERNS.merchantAt.find(body)
                ?: PATTERNS.merchantTo.find(body)
                ?: PATTERNS.merchantVia.find(body)

            if (merchantMatch != null) {
                merchant = cleanMerchantName(merchantMatch.groupValues[1])
            } else {
                val upiMatch = PATTERNS.upi.find(body)
                if (upiMatch != null) {
                    merchant = upiMatch.groupValues[1] // Use UPI ID as merchant
                } else {
                    // Fallback to Bank Name from sender if vague
                    merchant = cleanSenderId(sender)
                }
            }

            // 5. Payment Method
            var paymentMethod = "Other"
            if (PATTERNS.modeUpi.containsMatchIn(body)) paymentMethod = "UPI"
            else if (PATTERNS.modeCard.containsMatchIn(body)) paymentMethod = "Card"
            else if (PATTERNS.modeAtm.containsMatchIn(body)) paymentMethod = "Cash"
            else if (PATTERNS.modeNetbanking.containsMatchIn(body)) paymentMethod = "Bank Transfer"

            transactions.add(
                Transaction(
                    amount = amount,
                    type = type,
                    merchant = merchant,
                    category = categorizeMerchant(merchant),
                    paymentMethod = paymentMethod,
                    date = message.date,
                    rawMessage = body
                )
            )
        }

        return transactions
    }

    private fun isBankSms(sender: String): Boolean {
        val senderUpper = sender.uppercase(Locale.getDefault())
        // Matches typical bank SMS headers like "JM-ICICIB", "VK-HDFCBK", "QNB"
        return BANK_SENDER_IDS.any { senderUpper.contains(it) } ||
                Regex("^[A-Z]{2}-?[A-Z0-9]{6}$").matches(senderUpper)
    }

    private fun categorizeMerchant(merchant: String): String {
        val lower = merchant.lowercase(Locale.getDefault())
        
        return when {
            // Food & Dining
            lower.containsAny("swiggy", "zomato", "food", "restaurant", "cafe", "pizza", "burger", "talabat", "deliveroo", "kfc", "dominos", "mcdonalds", "starbucks", "coffee", "bakery", "kitchen") -> "Food"
            
            // Transportation
            lower.containsAny("uber", "ola", "fuel", "petrol", "pump", "metro", "rail", "karwa", "taxi", "cab", "transport", "airlines", "air", "flight", "irctc", "shell", "woqod") -> "Transportation"
            
            // Shopping
            lower.containsAny("amazon", "flipkart", "myntra", "retail", "mart", "shop", "store", "lulu", "carrefour", "mall", "fashion", "clothing", "apparel", "nike", "adidas", "zara", "h&m", "trends", "pantaloons") -> "Shopping"
            
            // Grocery
            lower.containsAny("grocery", "supermarket", "market", "fresh", "basket", "bigbasket", "blinkit", "zepto", "instamart") -> "Grocery"
            
            // Entertainment
            lower.containsAny("netflix", "spotify", "movie", "cinema", "prime", "youtube", "hotstar", "bookmyshow", "pvr", "inox", "entertainment", "game", "playstation", "steam") -> "Entertainment"
            
            // Healthcare
            lower.containsAny("pharmacy", "med", "hospital", "clinic", "doctor", "lab", "health", "apollo", "1mg", "pharmeasy") -> "Healthcare"
            
            // Utilities
            lower.containsAny("bill", "electricity", "recharge", "broadband", "wifi", "jio", "airtel", "vi", "vodafone", "bsnl", "ooredoo", "power", "water", "gas", "bescom", "insurance", "lic") -> "Utilities"
            
            // Income / Salary
            lower.containsAny("salary", "interest", "dividend", "cash deposit", "neft in") -> "Income"
            
            // Transfers
            lower.containsAny("transfer", "sent to", "upi") -> "Transfer"
            
            else -> "Other"
        }
    }

    private fun cleanMerchantName(raw: String): String {
        // Remove common SMS prefixes like "UPI-", "POS-", "VPS-"
        var cleaned = raw.replace(Regex("^(?i)(UPI|IMPS|NEFT|RTGS|ATM|POS|VPS|IPS)-?"), "").trim()
        
        // Remove common SMS suffixes/noise
        cleaned = cleaned.split(Regex("(?i)\\s+(?:on|ref|txn|val|dated|info)\\s+"))[0]
        
        // Remove nonsense if result is just digits or too short
        if (Regex("^\\d+$").matches(cleaned) || cleaned.length < 2) return "Unknown Merchant"
        
        // Truncate if too long
        if (cleaned.length > 20) cleaned = cleaned.substring(0, 20).trim() + "..."
        
        return cleaned.ifBlank { "Unknown" }
    }

    private fun cleanSenderId(sender: String): String {
        // Extracts useful part from sender ID like "JM-ICICIB" -> "ICICIB"
        return if (sender.contains("-")) {
            sender.substringAfter("-")
        } else {
            sender
        }.replace(Regex("[0-9]"), "") // Remove numbers
    }

    // Helper extension to check multiple keywords
    private fun String.containsAny(vararg keywords: String): Boolean {
        return keywords.any { this.contains(it) }
    }
}
