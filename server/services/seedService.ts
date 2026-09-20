import bcrypt from 'bcryptjs';
import { db } from '../config/database';

export async function seedInitialData(): Promise<void> {
  // Check if users already seeded
  const userCount = db.users.count();
  if (userCount > 0) {
    return;
  }

  console.log('Seeding initial FINOVA database...');

  const userPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Default Student User
  const studentUser = await db.users.insert({
    name: 'Alex Kumar',
    email: 'student@finova.in',
    passwordHash: userPasswordHash,
    role: 'USER',
    userType: 'STUDENT',
    preferredLanguage: 'en',
  });

  // 2. Create Admin User
  const adminUser = await db.users.insert({
    name: 'Finova Compliance Admin',
    email: 'admin@finova.in',
    passwordHash: adminPasswordHash,
    role: 'ADMIN',
    userType: 'YOUNG_WORKING_PROFESSIONAL',
    preferredLanguage: 'en',
  });

  const studentId = studentUser.id;
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const today = new Date();

  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  // 3. Transactions for Student User
  await db.transactions.insert({
    userId: studentId,
    type: 'INCOME',
    amount: 35000,
    category: 'Salary',
    description: 'Monthly Stipend & Freelance Payment',
    date: daysAgo(18),
    paymentMode: 'BANK_TRANSFER',
  });

  await db.transactions.insert({
    userId: studentId,
    type: 'INCOME',
    amount: 5000,
    category: 'Allowance & Pocket Money',
    description: 'Quarterly Academic Excellence Grant',
    date: daysAgo(10),
    paymentMode: 'UPI',
  });

  await db.transactions.insert({
    userId: studentId,
    type: 'EXPENSE',
    amount: 4200,
    category: 'Food & Dining',
    description: 'Weekly campus dining & team dinner',
    date: daysAgo(2),
    paymentMode: 'UPI',
  });

  await db.transactions.insert({
    userId: studentId,
    type: 'EXPENSE',
    amount: 1850,
    category: 'Groceries',
    description: 'Monthly hostel essentials & fruits',
    date: daysAgo(4),
    paymentMode: 'CARD',
  });

  await db.transactions.insert({
    userId: studentId,
    type: 'EXPENSE',
    amount: 1200,
    category: 'Transport & Travel',
    description: 'Metro smart card monthly recharge',
    date: daysAgo(6),
    paymentMode: 'UPI',
  });

  await db.transactions.insert({
    userId: studentId,
    type: 'EXPENSE',
    amount: 2499,
    category: 'Shopping',
    description: 'Ergonomic study desk lamp & backpack',
    date: daysAgo(8),
    paymentMode: 'UPI',
  });

  await db.transactions.insert({
    userId: studentId,
    type: 'EXPENSE',
    amount: 699,
    category: 'Entertainment',
    description: 'Digital audio & code IDE subscription',
    date: daysAgo(12),
    paymentMode: 'CARD',
  });

  await db.transactions.insert({
    userId: studentId,
    type: 'EXPENSE',
    amount: 1450,
    category: 'Bills & Utilities',
    description: 'Mobile 5G prepaid plan + broadband',
    date: daysAgo(14),
    paymentMode: 'UPI',
  });

  await db.transactions.insert({
    userId: studentId,
    type: 'EXPENSE',
    amount: 1800,
    category: 'Education',
    description: 'Cloud Certification Exam Practice Guide',
    date: daysAgo(15),
    paymentMode: 'UPI',
  });

  // 4. Budgets for Student User
  await db.budgets.insert({
    userId: studentId,
    category: 'Food & Dining',
    monthlyLimit: 6000,
    month: currentMonth,
    alertThreshold: 80,
    alertSent: false,
  });

  await db.budgets.insert({
    userId: studentId,
    category: 'Transport & Travel',
    monthlyLimit: 2500,
    month: currentMonth,
    alertThreshold: 80,
    alertSent: false,
  });

  await db.budgets.insert({
    userId: studentId,
    category: 'Shopping',
    monthlyLimit: 3000,
    month: currentMonth,
    alertThreshold: 80,
    alertSent: true, // Spent 2499/3000 = 83.3%
  });

  await db.budgets.insert({
    userId: studentId,
    category: 'Entertainment',
    monthlyLimit: 1500,
    month: currentMonth,
    alertThreshold: 80,
    alertSent: false,
  });

  // 5. Savings Goals
  await db.savingsGoals.insert({
    userId: studentId,
    title: 'MacBook & Development Rig',
    targetAmount: 65000,
    currentAmount: 38000,
    targetDate: '2026-12-15',
    category: 'Technology',
    isCompleted: false,
  });

  await db.savingsGoals.insert({
    userId: studentId,
    title: 'Emergency Starter Cushion',
    targetAmount: 20000,
    currentAmount: 16500,
    targetDate: '2026-10-30',
    category: 'Security',
    isCompleted: false,
  });

  // 6. Notifications for Student
  await db.notifications.insert({
    userId: studentId,
    type: 'BUDGET_ALERT',
    title: 'Shopping Budget Alert',
    message: 'You have consumed 83.3% of your monthly Shopping budget (₹2,499 of ₹3,000).',
    isRead: false,
  });

  await db.notifications.insert({
    userId: studentId,
    type: 'SAVINGS_REMINDER',
    title: 'Milestone within Reach!',
    message: 'Your "Emergency Starter Cushion" is 82.5% funded. Just ₹3,500 to goal completion!',
    isRead: false,
  });

  // 7. Seed Verified and Public Financial Resources in major hubs
  // Categories: Banks, Investment Advisers, Registered Valuers, Jewellers, Insurance, Land Registration Offices, Property Services
  const seededResources = [
    {
      name: 'State Bank of India - Nariman Point Main Branch',
      category: 'Banks',
      authority: 'RBI Regulated Public Sector Bank',
      registrationNumber: 'SBIN0000300',
      address: 'Madame Cama Road, Nariman Point, Mumbai, Maharashtra 400021',
      phone: '+91 22 2202 9456',
      email: 'customercare@sbi.co.in',
      location: { type: 'Point', coordinates: [72.8238, 18.9272] }, // Mumbai
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(5),
      sourceNotice: 'Official RBI Scheduled Bank Directory',
      isArchived: false,
    },
    {
      name: 'HDFC Bank - Connaught Place Branch',
      category: 'Banks',
      authority: 'RBI Regulated Scheduled Commercial Bank',
      registrationNumber: 'HDFC0000003',
      address: 'E-Block, Inner Circle, Connaught Place, New Delhi 110001',
      phone: '+91 11 4151 2200',
      email: 'support@hdfcbank.com',
      location: { type: 'Point', coordinates: [77.2195, 28.6315] }, // Delhi
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(8),
      sourceNotice: 'RBI Certified Banking Registry',
      isArchived: false,
    },
    {
      name: 'ICICI Bank - MG Road Branch',
      category: 'Banks',
      authority: 'RBI Regulated Commercial Bank',
      registrationNumber: 'ICIC0000002',
      address: 'No 1, M.G. Road, Bangalore, Karnataka 560001',
      phone: '+91 80 2558 4040',
      email: 'care@icicibank.com',
      location: { type: 'Point', coordinates: [77.6084, 12.9754] }, // Bengaluru
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(12),
      sourceNotice: 'RBI Official Registry',
      isArchived: false,
    },
    {
      name: 'Canara Bank - Anna Salai Branch',
      category: 'Banks',
      authority: 'RBI Regulated Public Sector Bank',
      registrationNumber: 'CNRB0000912',
      address: 'Anna Salai, Mount Road, Chennai, Tamil Nadu 600002',
      phone: '+91 44 2852 1144',
      email: 'annasalaibr@canarabank.com',
      location: { type: 'Point', coordinates: [80.2612, 13.0628] }, // Chennai
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(10),
      sourceNotice: 'RBI Certified Registry',
      isArchived: false,
    },
    {
      name: 'Axis Wealth & Advisory Services',
      category: 'Investment Advisers',
      authority: 'SEBI Registered Investment Adviser',
      registrationNumber: 'INA000001248',
      address: 'Bandra Kurla Complex (BKC), G Block, Bandra East, Mumbai 400051',
      phone: '+91 22 2425 2525',
      email: 'wealth.advisory@axisadvisers.in',
      location: { type: 'Point', coordinates: [72.8687, 19.0664] }, // Mumbai BKC
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(4),
      sourceNotice: 'SEBI Registered Intermediary Database',
      isArchived: false,
    },
    {
      name: 'Pinnacle Capital Growth Advisers',
      category: 'Investment Advisers',
      authority: 'SEBI Registered Investment Adviser',
      registrationNumber: 'INA000008892',
      address: 'Indiranagar 100 Feet Road, Bengaluru, Karnataka 560038',
      phone: '+91 80 4125 7800',
      email: 'consult@pinnacleadvisers.in',
      location: { type: 'Point', coordinates: [77.6412, 12.9719] }, // Bengaluru Indiranagar
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(14),
      sourceNotice: 'SEBI Public Disclosure List',
      isArchived: false,
    },
    {
      name: 'Spectrum Financial Consultants',
      category: 'Investment Advisers',
      authority: 'Unverified Entity - Community Listing',
      registrationNumber: '',
      address: 'Nehru Place Commercial Complex, New Delhi 110019',
      phone: '+91 11 2641 9900',
      email: '',
      location: { type: 'Point', coordinates: [77.2514, 28.5494] }, // Delhi Nehru Place
      verificationStatus: 'UNVERIFIED',
      lastVerifiedAt: null,
      sourceNotice: 'Public Directory Entry (Awaiting Official SEBI Reg verification)',
      isArchived: false,
    },
    {
      name: 'Tanishq Jewellers - BIS Hallmarked',
      category: 'Jewellers',
      authority: 'Bureau of Indian Standards (BIS) Certified',
      registrationNumber: 'BIS-HM-9284102',
      address: 'Linking Road, Khar West, Mumbai, Maharashtra 400052',
      phone: '+91 22 2600 5454',
      email: 'customercare@titan.co.in',
      location: { type: 'Point', coordinates: [72.8361, 19.0688] }, // Mumbai
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(2),
      sourceNotice: 'BIS National Hallmarking Registry',
      isArchived: false,
    },
    {
      name: 'GRT Jewellers - Cathedral Road',
      category: 'Jewellers',
      authority: 'Bureau of Indian Standards (BIS) Certified',
      registrationNumber: 'BIS-HM-8841092',
      address: 'Cathedral Road, Gopalapuram, Chennai, Tamil Nadu 600086',
      phone: '+91 44 2811 0080',
      email: 'mail@grtjewels.com',
      location: { type: 'Point', coordinates: [80.2528, 13.0489] }, // Chennai
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(7),
      sourceNotice: 'BIS Certified Hallmark Center',
      isArchived: false,
    },
    {
      name: 'Kalyan Goldsmiths & Valuers',
      category: 'Jewellers',
      authority: 'Local Market Listing',
      registrationNumber: '',
      address: 'Chandni Chowk Market, Old Delhi 110006',
      phone: '+91 11 2327 4100',
      email: '',
      location: { type: 'Point', coordinates: [77.2301, 28.6506] }, // Old Delhi
      verificationStatus: 'NEEDS_RECHECK',
      lastVerifiedAt: daysAgo(45),
      sourceNotice: 'Community report received regarding revised hallmarking license renewal',
      isArchived: false,
    },
    {
      name: 'National Insurance Company - Divisional Office',
      category: 'Insurance',
      authority: 'IRDAI Regulated Public Sector Insurer',
      registrationNumber: 'IRDAI/NL-048',
      address: '3 Middleton Street, Kolkata, West Bengal 700071',
      phone: '+91 33 2283 1705',
      email: 'support@nic.co.in',
      location: { type: 'Point', coordinates: [88.3512, 22.5489] }, // Kolkata
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(9),
      sourceNotice: 'IRDAI Official Licensed Insurers List',
      isArchived: false,
    },
    {
      name: 'Life Insurance Corporation (LIC) - Divisional Branch',
      category: 'Insurance',
      authority: 'IRDAI Regulated Statutory Corporation',
      registrationNumber: 'IRDAI/L-001',
      address: 'Jeevan Prakash, Kasturba Gandhi Marg, New Delhi 110001',
      phone: '+91 11 2884 4100',
      email: 'bo_delhi@licindia.com',
      location: { type: 'Point', coordinates: [77.2241, 28.6289] }, // Delhi
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(6),
      sourceNotice: 'IRDAI Directory of Life Insurers',
      isArchived: false,
    },
    {
      name: 'Sub-Registrar Office - Bandra (Land Registration)',
      category: 'Land Registration Offices',
      authority: 'Inspector General of Registration & Stamps, Maharashtra',
      registrationNumber: 'MH-REG-BND-01',
      address: 'Administrative Building, Near Collector Office, Bandra East, Mumbai 400051',
      phone: '+91 22 2655 8812',
      email: 'sro.bandra@igrmaharashtra.gov.in',
      location: { type: 'Point', coordinates: [72.8522, 19.0596] }, // Mumbai
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(3),
      sourceNotice: 'Official Maharashtra IGR Portal',
      isArchived: false,
    },
    {
      name: 'Sub-Registrar Office - Jayanagar',
      category: 'Land Registration Offices',
      authority: 'Department of Stamps and Registration, Karnataka',
      registrationNumber: 'KA-REG-JAY-04',
      address: 'BDA Complex, 4th Block, Jayanagar, Bengaluru, Karnataka 560011',
      phone: '+91 80 2663 3311',
      email: 'sro.jayanagar@karnataka.gov.in',
      location: { type: 'Point', coordinates: [77.5833, 12.9298] }, // Bengaluru
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(11),
      sourceNotice: 'Kaveri Online Services Official Directory',
      isArchived: false,
    },
    {
      name: 'Apex Asset Valuers & Chartered Engineers',
      category: 'Registered Valuers',
      authority: 'Insolvency and Bankruptcy Board of India (IBBI) Registered',
      registrationNumber: 'IBBI/RV/06/2021/14022',
      address: 'Somajiguda, Raj Bhavan Road, Hyderabad, Telangana 500082',
      phone: '+91 40 2330 8820',
      email: 'info@apexvaluers.in',
      location: { type: 'Point', coordinates: [78.4619, 17.4241] }, // Hyderabad
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: daysAgo(15),
      sourceNotice: 'IBBI Registered Valuers Directory',
      isArchived: false,
    },
  ];

  let firstResId = '';
  for (let i = 0; i < seededResources.length; i++) {
    const res = await db.resources.insert(seededResources[i] as any);
    if (i === 9) firstResId = res.id; // Kalyan Goldsmiths
  }

  // 8. Sample Report on Kalyan Goldsmiths
  if (firstResId) {
    await db.resourceReports.insert({
      resourceId: firstResId,
      resourceName: 'Kalyan Goldsmiths & Valuers',
      reportedBy: studentId,
      reporterName: 'Alex Kumar',
      issueType: 'WRONG_ADDRESS',
      notes: 'Shop relocated 50 meters down the lane near Dariba Kalan corner. Hallmarking certificate under renewal.',
      status: 'PENDING',
      adminNotes: '',
    });
  }

  // 9. Seed 14 Financial Education Articles
  const articles = [
    {
      category: 'Budgeting',
      title: 'Mastering the 50/30/20 Rule for Beginners',
      shortExplanation: 'A straightforward rule of thumb for dividing your take-home pay into needs, wants, and savings without complex spreadsheets.',
      example: 'If your monthly income or stipend is ₹20,000: Spend ₹10,000 (50%) on rent, food, and commute; ₹6,000 (30%) on dining out, hobbies, and movies; and automatically move ₹4,000 (20%) into savings or SIP.',
      keyPoints: [
        '50% Needs: Rent, groceries, electricity, essential medical bills, transit.',
        '30% Wants: Weekend outings, subscriptions, fashion, vacations.',
        '20% Financial Future: Emergency fund deposits, mutual fund SIPs, debt payoffs.',
        'Pay yourself first: Move the 20% on salary day before spending on wants.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Saving',
      title: 'The Psychology of Friction in Micro-Savings',
      shortExplanation: 'How adding friction to spending and automating savings turns small daily habits into compounding wealth.',
      example: 'Setting up a standing instruction to auto-debit ₹100 daily or ₹1,000 weekly into a recurring deposit immediately after allowance arrival.',
      keyPoints: [
        'Out of sight, out of mind: Keep savings in a separate account without UPI connected.',
        'Round-up savings: Put spare change from rounded transactions into a digital gold or liquid fund.',
        'Wait 48 hours before non-essential purchases above ₹1,500.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Emergency Fund',
      title: 'Building Your First 3-Month Safety Net',
      shortExplanation: 'An emergency fund is money set aside specifically for unforeseen financial shocks like sudden medical issues or job loss.',
      example: 'If your bare-minimum survival expenses are ₹12,000/month, aim for an initial emergency fund of ₹36,000 kept in a sweep-in FD or liquid fund.',
      keyPoints: [
        'Never invest emergency funds in volatile stocks or locked real estate.',
        'Liquidity is priority #1, returns are secondary.',
        'Prevents taking high-interest personal loans or maxing credit cards.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Banking',
      title: 'Demystifying Savings Accounts, UPI, and Sweep FDs',
      shortExplanation: 'How Indian banking mechanisms work and how to earn 6-7% on idle cash without losing instant liquidity.',
      example: 'Enabling "Auto-Sweep" on your bank account automatically transfers balances above ₹25,000 into high-interest fixed deposits, and sweeps them back instantly if you swipe your card.',
      keyPoints: [
        'Auto-sweep FDs give term deposit interest rates with zero withdrawal penalties.',
        'UPI PIN is ONLY required for sending money, NEVER for receiving money.',
        'DICGC insures bank deposits up to ₹5,00,000 per depositor per bank.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'SIP',
      title: 'SIP: Starting Wealth Creation with ₹500/Month',
      shortExplanation: 'Systematic Investment Plans allow disciplined, automated monthly investing into mutual funds with rupee-cost averaging.',
      example: 'Investing ₹2,000/month in a diversified index fund for 10 years at a 12% annualized return yields approx ₹4.6 Lakhs from an invested capital of ₹2.4 Lakhs.',
      keyPoints: [
        'Rupee-cost averaging buys more units when prices dip, fewer when high.',
        'Eliminates the impossible stress of trying to "time" market peaks and bottoms.',
        'Step-up SIP: Increase your monthly installment by 10% annually with every salary raise.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Mutual Funds',
      title: 'Active vs Passive Index Funds Explained Simply',
      shortExplanation: 'Understanding the difference between fund managers picking stocks vs mirroring standard market indexes like Nifty 50.',
      example: 'A Nifty 50 Index Fund simply buys the top 50 companies in India proportionally with an expense ratio as low as 0.1% to 0.2%.',
      keyPoints: [
        'Index funds offer broad diversification at very low expense ratios.',
        'Active funds charge higher management fees (1-2%) to beat the benchmark.',
        'For beginners, low-cost broad index funds form the safest core foundation.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Inflation',
      title: 'Inflation: The Silent Thief of Purchasing Power',
      shortExplanation: 'Why keeping cash in a physical locker or basic 3% savings account actually reduces your real wealth over time.',
      example: 'If a meal costs ₹200 today and inflation is 6%, that same meal will cost ₹212 next year. If your bank only paid 3% interest (₹206), you lost ₹6 in real purchasing power.',
      keyPoints: [
        'Real Return = Nominal Interest Rate minus Inflation Rate.',
        'Long-term investments must beat inflation (historically 6-7% in India).',
        'Equities and gold have historically acted as shields against monetary inflation.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Loans',
      title: 'Good Debt vs Bad Debt & Managing Credit Scores',
      shortExplanation: 'How credit cards, student loans, and credit scores (CIBIL) work, and how to avoid the dangerous minimum-due trap.',
      example: 'Paying only the "Minimum Amount Due" on a credit card charges up to 42% APR interest on the remaining balance from the date of purchase.',
      keyPoints: [
        'Good debt builds earning capacity or assets (education loan, business loan).',
        'Bad debt finances depreciating lifestyle consumables (credit card revolving debt).',
        'Aim for a CIBIL credit score above 750 by always paying statements in full on time.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'FD',
      title: 'Fixed Deposits & Recurring Deposits: Safe Anchors',
      shortExplanation: 'Guaranteed-return fixed income options backed by banks and government post offices.',
      example: 'Booking a 1-year bank FD locking in a guaranteed 7.1% interest rate for planned upcoming expenses like college tuition fees.',
      keyPoints: [
        'Zero market risk; principal and interest are contractually guaranteed.',
        'Taxability: Interest is taxed according to your individual income tax slab.',
        'Best suited for short-term goals (< 3 years) where capital preservation is critical.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Gold',
      title: 'Physical Gold vs Sovereign Gold Bonds (SGB)',
      shortExplanation: 'Modern digital and government alternatives to traditional jewellery that eliminate making charges and storage risk.',
      example: 'RBI Sovereign Gold Bonds pay an additional 2.5% annual interest on gold price, plus capital gains are completely tax-free on 8-year maturity.',
      keyPoints: [
        'Physical jewellery carries 10-25% making charges and GST.',
        'Sovereign Gold Bonds track 24k gold price with zero storage or locker fees.',
        'BIS 916 Hallmark verification is essential when buying physical gold.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Government Bonds',
      title: 'RBI Retail Direct & Treasury Bills for Beginners',
      shortExplanation: 'Direct investment in sovereign Government of India bonds with the highest safety tier in the country.',
      example: 'Buying a 91-day Treasury Bill through RBI Retail Direct with as little as ₹10,000 with zero brokerage fees.',
      keyPoints: [
        'Sovereign guarantee: The safest credit quality in Indian rupees.',
        'Direct access through RBI Retail Direct portal without intermediary commissions.',
        'Available in short tenures (T-Bills) and long tenures (G-Secs up to 40 years).'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Insurance',
      title: 'Term Life & Health Insurance Before Any Investing',
      shortExplanation: 'Why pure protection policies must precede investment portfolios to prevent catastrophic wealth wipeout.',
      example: 'A 24-year-old non-smoker can secure a ₹1 Crore pure term insurance policy for approx ₹700–900/month.',
      keyPoints: [
        'Do not mix investment with insurance (avoid endowment/money-back plans).',
        'Health insurance protects your savings from skyrocketing hospitalization bills.',
        'Buy pure term insurance early when premiums are lowest and health is pristine.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Interest',
      title: 'Simple vs Compound Interest: The 8th Wonder',
      shortExplanation: 'How earning interest on previously earned interest creates exponential wealth over multi-year horizons.',
      example: '₹1 Lakh invested at 12% CAGR doubles every 6 years (Rule of 72). In 24 years, it grows 16-fold to ₹16 Lakhs without adding another rupee.',
      keyPoints: [
        'Time in the market matters far more than timing the market.',
        'Start in your early 20s to give compounding the longest possible runway.',
        'Compound interest works for you in investments, but against you in credit card debt.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
    {
      category: 'Financial Safety',
      title: 'Detecting Scams, Fake Part-time Jobs & UPI Frauds',
      shortExplanation: 'Recognizing social engineering, lottery scams, fake investment apps, and UPI collection requests.',
      example: 'A fraudster asks you to scan a QR code to "receive ₹5,000 prize money". Scanning and entering your UPI PIN always DEDUCTS money.',
      keyPoints: [
        'Golden Rule: You NEVER enter your UPI PIN to receive money.',
        'Beware of Telegram task scam groups promising "double money in 24 hours".',
        'Check SEBI and RBI registries before depositing money with any entity.'
      ],
      source: 'Finova Financial Education',
      language: 'en',
      isPublished: true,
    },
  ];

  for (const art of articles) {
    await db.financialArticles.insert(art);
  }

  // 10. Sample Document in Student Vault
  await db.documents.insert({
    userId: studentId,
    name: 'College_Offer_Letter_2026.pdf',
    category: 'Education',
    fileSize: 245100, // 245 KB
    mimeType: 'application/pdf',
    notes: 'Official admission letter with student ID confirmation',
  });

  console.log('Seeding completed successfully: Created 2 users, ledger transactions, budgets, goals, verified resources, and 14 articles.');
}
