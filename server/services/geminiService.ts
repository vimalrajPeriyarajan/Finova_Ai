import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface UserFinancialContext {
  availableBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  topCategories: { category: string; amount: number }[];
  activeBudgets: { category: string; limit: number; spent: number }[];
  savingsGoals: { title: string; target: number; current: number }[];
  recentTransactions: { type: string; category: string; amount: number; description: string }[];
}

export async function generateFinancialAdvice(
  prompt: string,
  userContext: UserFinancialContext,
  language: string = 'en'
): Promise<string> {
  const ai = getAiClient();

  const contextSummary = `
User Financial Summary:
- Available Balance: ₹${userContext.availableBalance}
- Monthly Income: ₹${userContext.monthlyIncome}
- Monthly Expenses: ₹${userContext.monthlyExpense}
- Top Expense Categories: ${userContext.topCategories.map((c) => `${c.category} (₹${c.amount})`).join(', ') || 'None'}
- Active Budgets: ${userContext.activeBudgets.map((b) => `${b.category}: ₹${b.spent}/₹${b.limit}`).join(', ') || 'None'}
- Savings Goals: ${userContext.savingsGoals.map((g) => `${g.title}: ₹${g.current}/₹${g.target}`).join(', ') || 'None'}
- Recent Transactions: ${userContext.recentTransactions.slice(0, 5).map((t) => `${t.type} ₹${t.amount} on ${t.category} (${t.description})`).join(', ') || 'None'}
- User Preferred Language: ${language}
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are "Finova AI", a friendly, knowledgeable, and responsible personal finance learning assistant designed for college students, first-time earners, and young professionals.
You provide clear financial education, spending breakdown, budgeting guidance, and basic money habit coaching.

CRITICAL SAFETY DIRECTIVES:
1. NEVER guarantee returns or recommend specific stocks/speculative assets.
2. NEVER claim professional legal, tax, or SEBI-regulated financial advisory authority.
3. Always provide clear, empathetic, practical explanations (e.g. 50/30/20 rule, emergency funds, compounding interest, SIPs, debt repayment).
4. If asked about the user's personal finances, refer to the provided User Financial Summary accurately.
5. If the user asks in Hindi, Tamil, Telugu, Kannada, Bengali, etc., reply in that language or bilingual English-Indian context as appropriate.
6. Keep your answers structured, concise, and easy to read on mobile screens (use short paragraphs and bullet points).

${contextSummary}`,
        },
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, using deterministic rule-based fallback:', err?.message || err);
    }
  }

  // Deterministic rule-based fallback
  return generateRuleBasedFallback(prompt, userContext);
}

function generateRuleBasedFallback(prompt: string, context: UserFinancialContext): string {
  const p = prompt.toLowerCase();

  if (p.includes('spend') || p.includes('where did i spend') || p.includes('most')) {
    if (context.topCategories.length === 0) {
      return `You haven't recorded any expenses yet this month! Start by tapping the "+" button to log your first expense and I'll analyze your spending trends.`;
    }
    const top = context.topCategories[0];
    const second = context.topCategories[1];
    return `📊 **Your Spending Breakdown:**\n\nYour highest expense category is **${top.category}** at **₹${top.amount.toLocaleString('en-IN')}**.\n${
      second ? `Next is **${second.category}** at **₹${second.amount.toLocaleString('en-IN')}**.\n\n` : '\n'
    }💡 *Tip:* Setting a category budget for ${top.category} can help you keep daily discretionary expenses in check.`;
  }

  if (p.includes('reduce') || p.includes('cut') || p.includes('save more')) {
    const savings = context.monthlyIncome - context.monthlyExpense;
    return `🎯 **Actionable Ways to Save More:**\n\n1. **Adopt the 50/30/20 Rule**: Aim for 50% on needs, 30% on lifestyle wants, and 20% directly into savings/investments.\n2. **Audit Subscriptions & Dining**: Small recurring expenses often add up to 20-30% of monthly outflows.\n3. **Automate Payday Savings**: Transfer your target savings on the day your salary or allowance arrives before spending.\n\nYour current net savings for this period is **₹${Math.max(0, savings).toLocaleString('en-IN')}**.`;
  }

  if (p.includes('sip') || p.includes('mutual fund')) {
    return `📈 **What is a SIP (Systematic Investment Plan)?**\n\n- **Simple Idea**: Instead of investing a large lump sum, you invest a fixed amount (e.g. ₹500 or ₹1,000) every month into a mutual fund.\n- **Rupee Cost Averaging**: When the market is down, you buy more units; when up, fewer units. This averages out market volatility.\n- **Power of Compounding**: Over 5–10+ years, compounding helps build wealth even with small monthly student/entry-level savings.\n\n*Note: Mutual funds are subject to market risks. Always read scheme-related documents carefully.*`;
  }

  if (p.includes('emergency fund') || p.includes('emergency')) {
    const recommended = context.monthlyExpense > 0 ? context.monthlyExpense * 3 : 15000;
    return `🛡️ **Emergency Fund Essentials:**\n\nAn emergency fund is 3 to 6 months of essential living expenses kept in liquid, easily accessible accounts (like a high-interest savings account or liquid FD).\n\nBased on your current monthly expenses of ₹${context.monthlyExpense.toLocaleString('en-IN')}, a good baseline target for you is **₹${recommended.toLocaleString('en-IN')}**.\n\nThis shields you from sudden medical emergencies, vehicle repairs, or job transitions without taking high-interest loans.`;
  }

  if (p.includes('budget') || p.includes('how much should i save')) {
    return `💰 **Your Financial Health Summary:**\n\n- **Available Balance**: ₹${context.availableBalance.toLocaleString('en-IN')}\n- **Total Income**: ₹${context.monthlyIncome.toLocaleString('en-IN')}\n- **Total Expenses**: ₹${context.monthlyExpense.toLocaleString('en-IN')}\n\nWe recommend allocating at least **20% (₹${Math.round(context.monthlyIncome * 0.2).toLocaleString('en-IN')})** to savings and long-term goals each month.`;
  }

  return `Hello! I am **Finova AI**, your personal finance assistant.\n\nRight now you have **₹${context.availableBalance.toLocaleString('en-IN')}** available in your balance with total monthly income of **₹${context.monthlyIncome.toLocaleString('en-IN')}** and expenses of **₹${context.monthlyExpense.toLocaleString('en-IN')}**.\n\nFeel free to ask me about:\n- *"Where did I spend the most?"*\n- *"How can I reduce my spending?"*\n- *"Explain SIP simply"*\n- *"How to build an emergency fund?"*`;
}

export async function parseVoiceTransaction(transcript: string): Promise<{
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  date: string;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
}> {
  const ai = getAiClient();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Parse this spoken expense/income sentence into strict JSON: "${transcript}".
Return a JSON object with:
- "amount": positive number
- "type": "EXPENSE" or "INCOME"
- "category": one of ["Food & Dining", "Groceries", "Transport & Travel", "Shopping", "Bills & Utilities", "Entertainment", "Education", "Health & Medical", "Salary", "Freelance & Projects", "Allowance & Pocket Money", "Other"]
- "description": concise description string
- "date": "YYYY-MM-DD" (today is ${new Date().toISOString().split('T')[0]})
- "paymentMode": "CASH", "UPI", "CARD", "BANK_TRANSFER", or "OTHER"`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        if (parsed.amount && Number(parsed.amount) > 0) {
          return {
            amount: Number(parsed.amount),
            type: parsed.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            category: parsed.category || 'Food & Dining',
            description: parsed.description || transcript,
            date: parsed.date || new Date().toISOString().split('T')[0],
            paymentMode: parsed.paymentMode || 'UPI',
          };
        }
      }
    } catch (err: any) {
      console.warn('Gemini voice parse failed, using rule-based parsing:', err?.message || err);
    }
  }

  // Regex and heuristic parsing
  const clean = transcript.toLowerCase();

  // Extract amount
  const amountMatch = clean.match(/(?:rs\.?|rupees?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
  let amount = 100;
  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  let type: 'INCOME' | 'EXPENSE' = 'EXPENSE';
  if (clean.includes('received') || clean.includes('got') || clean.includes('earned') || clean.includes('salary') || clean.includes('income')) {
    type = 'INCOME';
  }

  let category = 'Other';
  let description = transcript;
  let paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER' = 'UPI';

  if (clean.includes('cash')) paymentMode = 'CASH';
  else if (clean.includes('card')) paymentMode = 'CARD';
  else if (clean.includes('transfer') || clean.includes('neft') || clean.includes('imps')) paymentMode = 'BANK_TRANSFER';
  else if (clean.includes('gpay') || clean.includes('phonepe') || clean.includes('paytm') || clean.includes('upi')) paymentMode = 'UPI';

  if (type === 'INCOME') {
    if (clean.includes('salary')) category = 'Salary';
    else if (clean.includes('freelance') || clean.includes('project')) category = 'Freelance & Projects';
    else if (clean.includes('allowance') || clean.includes('pocket money')) category = 'Allowance & Pocket Money';
    else category = 'Income';
  } else {
    if (clean.includes('lunch') || clean.includes('dinner') || clean.includes('breakfast') || clean.includes('food') || clean.includes('coffee') || clean.includes('tea') || clean.includes('restaurant') || clean.includes('snack') || clean.includes('zomato') || clean.includes('swiggy')) {
      category = 'Food & Dining';
      description = clean.includes('lunch') ? 'Lunch' : clean.includes('dinner') ? 'Dinner' : clean.includes('coffee') ? 'Coffee' : 'Food';
    } else if (clean.includes('groceries') || clean.includes('grocery') || clean.includes('milk') || clean.includes('vegetable') || clean.includes('supermarket')) {
      category = 'Groceries';
      description = 'Groceries';
    } else if (clean.includes('cab') || clean.includes('auto') || clean.includes('uber') || clean.includes('ola') || clean.includes('metro') || clean.includes('bus') || clean.includes('petrol') || clean.includes('fuel')) {
      category = 'Transport & Travel';
      description = 'Travel / Transport';
    } else if (clean.includes('movie') || clean.includes('game') || clean.includes('netflix') || clean.includes('spotify') || clean.includes('fun')) {
      category = 'Entertainment';
      description = 'Entertainment';
    } else if (clean.includes('bill') || clean.includes('recharge') || clean.includes('electricity') || clean.includes('wifi')) {
      category = 'Bills & Utilities';
      description = 'Bills & Recharge';
    } else if (clean.includes('shopping') || clean.includes('shirt') || clean.includes('clothes') || clean.includes('amazon') || clean.includes('flipkart')) {
      category = 'Shopping';
      description = 'Shopping';
    } else if (clean.includes('book') || clean.includes('course') || clean.includes('exam') || clean.includes('college')) {
      category = 'Education';
      description = 'Education & Books';
    } else if (clean.includes('medicine') || clean.includes('doctor') || clean.includes('pharmacy') || clean.includes('hospital')) {
      category = 'Health & Medical';
      description = 'Medical / Health';
    }
  }

  return {
    amount,
    type,
    category,
    description: description || 'Voice entry',
    date: new Date().toISOString().split('T')[0],
    paymentMode,
  };
}
