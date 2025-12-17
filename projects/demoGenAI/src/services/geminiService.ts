/**
 * Gemini AI Service
 * Provides AI-powered country insights including carriers, market share, and sales tips
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { cacheService } from './cacheService';

export interface CarrierInfo {
  name: string;
  marketShare: number;
  isFedEx: boolean;
}

export interface CountryInsights {
  country: string;
  carriers: CarrierInfo[];
  fedexSentiment: string;
  salesTips: string[];
  emailTemplate: string;
  generatedAt: string;
}

/**
 * Generate country insights using Gemini API
 */
export async function getCountryInsights(
  country: string,
  revenue: number,
  bookings: number
): Promise<CountryInsights> {
  // Check cache first
  const cacheKey = `country_insights_${country}`;
  const cached = cacheService.get<CountryInsights>(cacheKey);

  if (cached) {
    console.log(`Using cached insights for ${country}`);
    return cached;
  }

  // Get API key from environment
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY not found, using mock data');
    return getMockInsights(country, revenue, bookings);
  }

  try {
    // Call Gemini API
    const prompt = buildPrompt(country, revenue, bookings);
    const response = await callGeminiAPI(apiKey, prompt);
    const insights = parseGeminiResponse(country, response);

    // Cache the result
    cacheService.set(cacheKey, insights);

    return insights;
  } catch (error) {
    console.error('Gemini API error:', error);
    // Fallback to mock data
    return getMockInsights(country, revenue, bookings);
  }
}

/**
 * Build prompt for Gemini
 */
function buildPrompt(country: string, revenue: number, bookings: number): string {
  return `You are a logistics market analyst. Analyze the shipping and logistics market in ${country}.

**Context:**
- Country: ${country}
- Current Revenue: €${(revenue / 1_000_000).toFixed(2)}M
- Total Bookings: ${bookings.toLocaleString()}

**IMPORTANT: Provide ACCURATE, REAL market data for ${country}. Research the actual logistics market.**

Return your analysis as a JSON object with this EXACT structure:

{
  "carriers": [
    {"name": "Carrier Name 1", "marketShare": 28.5},
    {"name": "Carrier Name 2", "marketShare": 22.0},
    {"name": "FedEx", "marketShare": 15.0},
    ...5-7 total carriers
  ],
  "fedexSentiment": "2-3 sentences about FedEx's actual market position, perception, and competitive standing in ${country}",
  "salesTips": [
    "Specific actionable tip 1 for ${country}",
    "Specific actionable tip 2 for ${country}",
    "Specific actionable tip 3 for ${country}",
    "Specific actionable tip 4 for ${country}",
    "Specific actionable tip 5 for ${country}"
  ],
  "emailTemplate": "Subject: [Compelling subject line]\n\nDear [Prospect Name],\n\n[Professional email body with market insights and value proposition for ${country}]\n\nBest regards,\n[Your Name]\nFedEx Sales Team"
}

**Requirements:**
1. List 5-7 REAL major carriers operating in ${country} (DHL, UPS, FedEx, local carriers, etc.)
2. Market share percentages MUST total 100% and reflect ACTUAL market reality
3. ALWAYS include FedEx with its REAL estimated market share in ${country}
4. Base market shares on actual logistics market data for ${country}
5. Sales tips must be specific to ${country}'s market conditions
6. Return ONLY valid JSON, no markdown code blocks or extra text`;
}

/**
 * Call Gemini API using official SDK
 */
async function callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
  console.log('🔄 Calling Gemini API with official SDK...');
  console.log('🔑 API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
  console.log('📦 SDK Version: @google/generative-ai');

  // Initialize the Google Generative AI client
  const genAI = new GoogleGenerativeAI(apiKey);
  console.log('✅ GoogleGenerativeAI client initialized');

  // Try different model names - using Gemini 2.0/2.5 models available for your API key
  const modelNamesToTry = [
    'gemini-2.5-flash',              // Latest and fastest (recommended)
    'gemini-2.0-flash',              // Alternative flash model
    'gemini-2.5-pro',                // More capable but slower
    'gemini-2.0-flash-exp',          // Experimental version
  ];

  console.log('💡 Will try these models in order:', modelNamesToTry);

  let lastError: any = null;

  // Try each model until one works
  for (const modelName of modelNamesToTry) {
    try {
      console.log('\n🤖 Attempting with model:', modelName);

      // Get the model
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,  // Increased from 2048 to prevent truncation
          responseMimeType: "application/json",  // Request JSON format directly
        }
      });
      console.log('✅ Model instance created');

      console.log('📝 Prompt length:', prompt.length, 'characters');
      console.log('⏳ Generating content...');

      // Generate content
      const result = await model.generateContent(prompt);
      console.log('✅ Generate content call completed');

      const response = result.response;
      console.log('✅ Response object received');

      const text = response.text();
      console.log('✅ Text extracted from response');
      console.log('📄 Response length:', text.length, 'characters');

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      console.log(`🎉 SUCCESS with model: ${modelName}`);
      return text;

    } catch (error: any) {
      console.error(`❌ Model "${modelName}" failed:`);
      console.error('  Error type:', error?.constructor?.name);
      console.error('  Error message:', error?.message);
      lastError = error;

      // If this is a 404 model not found error, try the next model
      if (error?.message?.includes('not found') || error?.message?.includes('404')) {
        console.log('  → Trying next model...');
        continue;
      } else {
        // If it's a different error (auth, quota, etc), throw immediately
        console.error('  → Non-404 error, stopping retry');
        throw error;
      }
    }
  }

  // If we got here, all models failed
  console.error('❌ All models failed. Last error:');
  console.error('Full error:', lastError);
  throw lastError || new Error('All model attempts failed');
}

/**
 * Parse Gemini response
 */
function parseGeminiResponse(country: string, response: string): CountryInsights {
  try {
    console.log('📄 Raw response length:', response.length);
    console.log('📄 Raw response preview:', response.substring(0, 500));

    // Remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Extract JSON from response - find the complete JSON object
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    console.log('📄 Extracted JSON length:', jsonMatch[0].length);

    const parsed = JSON.parse(jsonMatch[0]);

    console.log(`✓ Gemini API response for ${country}:`, parsed);

    // Map carriers and identify FedEx
    const carriers: CarrierInfo[] = parsed.carriers.map((c: any) => ({
      name: c.name,
      marketShare: parseFloat(c.marketShare.toFixed(1)),
      isFedEx: c.name.toLowerCase().includes('fedex')
    }));

    // Ensure FedEx is in the list
    if (!carriers.some(c => c.isFedEx)) {
      console.warn(`FedEx not in Gemini response for ${country}, adding it`);
      carriers.push({
        name: 'FedEx',
        marketShare: 10.0,
        isFedEx: true
      });

      // Adjust percentages to total 100%
      const total = carriers.reduce((sum, c) => sum + c.marketShare, 0);
      carriers.forEach(c => {
        c.marketShare = parseFloat(((c.marketShare / total) * 100).toFixed(1));
      });
    }

    // Validate total is ~100%
    const total = carriers.reduce((sum, c) => sum + c.marketShare, 0);
    if (Math.abs(total - 100) > 1) {
      console.warn(`Market shares don't total 100% (${total}%), normalizing...`);
      carriers.forEach(c => {
        c.marketShare = parseFloat(((c.marketShare / total) * 100).toFixed(1));
      });
    }

    const fedexShare = carriers.find(c => c.isFedEx)?.marketShare || 0;
    console.log(`${country}: FedEx REAL market share = ${fedexShare}%`);

    return {
      country,
      carriers,
      fedexSentiment: parsed.fedexSentiment,
      salesTips: parsed.salesTips,
      emailTemplate: parsed.emailTemplate,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.error('Raw response:', response);
    throw error;
  }
}

/**
 * Get mock insights (fallback)
 * Varies by country to provide more realistic data
 */
function getMockInsights(country: string, revenue: number, bookings: number): CountryInsights {
  // Generate country-specific carrier list based on country name hash
  const countryHash = country.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Base carriers with regional variations
  const allCarriers = [
    { name: 'DHL', base: 30 },
    { name: 'UPS', base: 22 },
    { name: 'FedEx', base: 18 },
    { name: 'TNT', base: 12 },
    { name: 'DPD', base: 10 },
    { name: 'GLS', base: 8 },
    { name: 'Aramex', base: 6 },
    { name: 'SF Express', base: 15 },
    { name: 'Japan Post', base: 20 },
    { name: 'Australia Post', base: 25 },
    { name: 'Royal Mail', base: 18 },
    { name: 'La Poste', base: 16 },
    { name: 'Deutsche Post', base: 22 }
  ];

  // Select 5-6 carriers based on country
  const selectedCarriers = allCarriers
    .sort((a, b) => {
      const aScore = (a.name.charCodeAt(0) + countryHash) % 100;
      const bScore = (b.name.charCodeAt(0) + countryHash) % 100;
      return bScore - aScore;
    })
    .slice(0, 5 + (countryHash % 2));

  // Adjust market shares with variance based on country
  const carriers: CarrierInfo[] = selectedCarriers.map((carrier, index) => {
    const seed = countryHash + index * 37;

    let marketShare;
    if (carrier.name === 'FedEx') {
      // FedEx gets more variance: can be 5-50% before normalization
      const fedexVariance = (countryHash % 80) - 40; // -40 to +40
      marketShare = Math.max(5, carrier.base + fedexVariance);
    } else {
      // Other carriers: smaller variance
      const variance = ((seed % 30) - 15); // -15 to +15
      marketShare = Math.max(3, carrier.base + variance);
    }

    return {
      name: carrier.name,
      marketShare,
      isFedEx: carrier.name === 'FedEx'
    };
  });

  // Normalize to 100%
  const total = carriers.reduce((sum, c) => sum + c.marketShare, 0);
  carriers.forEach(c => {
    c.marketShare = parseFloat(((c.marketShare / total) * 100).toFixed(1));
  });

  // Ensure FedEx is in the list
  if (!carriers.some(c => c.isFedEx)) {
    carriers.push({ name: 'FedEx', marketShare: 12.5, isFedEx: true });
    const total = carriers.reduce((sum, c) => sum + c.marketShare, 0);
    carriers.forEach(c => {
      c.marketShare = parseFloat(((c.marketShare / total) * 100).toFixed(1));
    });
  }

  // Sort by market share
  carriers.sort((a, b) => b.marketShare - a.marketShare);

  // Generate country-specific sentiment
  const fedexRank = carriers.findIndex(c => c.isFedEx) + 1;
  const fedexShare = carriers.find(c => c.isFedEx)?.marketShare || 0;

  console.log(`${country}: FedEx MOCK market share = ${fedexShare.toFixed(1)}%, rank = ${fedexRank}`);

  const sentiments = [
    `FedEx holds a ${fedexRank === 1 ? 'leading' : fedexRank <= 3 ? 'strong competitive' : 'growing'} position in ${country} with ${fedexShare.toFixed(1)}% market share. The company's international network and express delivery capabilities are key differentiators in this market.`,
    `In ${country}, FedEx is the ${fedexRank === 1 ? '#1' : `#${fedexRank}`} logistics provider with ${fedexShare.toFixed(1)}% market share. Strong brand recognition and reliable service quality drive customer loyalty, though price pressure from local competitors remains a factor.`,
    `FedEx maintains ${fedexShare.toFixed(1)}% of the shipping market in ${country}, ranking ${fedexRank === 1 ? 'first' : `${fedexRank}${fedexRank === 2 ? 'nd' : fedexRank === 3 ? 'rd' : 'th'}`} among major carriers. Investment in technology and tracking systems has strengthened the company's competitive position.`
  ];
  const fedexSentiment = sentiments[countryHash % sentiments.length];

  // Generate country-specific tips
  const tipsPool = [
    [`Expand partnerships with local e-commerce platforms in ${country}`, `Develop region-specific pricing packages for SMEs`, `Increase marketing presence in emerging industrial zones`],
    [`Launch targeted campaigns highlighting international shipping capabilities`, `Offer customized solutions for ${country}'s key export industries`, `Build relationships with major retailers and distributors`],
    [`Invest in same-day delivery services in major ${country} cities`, `Create loyalty programs for high-volume shippers`, `Enhance mobile app features for local market preferences`],
    [`Establish strategic partnerships with local last-mile delivery providers`, `Offer specialized cold chain logistics for perishables`, `Develop industry-specific solutions (healthcare, automotive, tech)`],
    [`Host customer workshops on supply chain optimization`, `Provide free shipping audits to demonstrate cost savings`, `Increase warehouse capacity in key ${country} logistics hubs`]
  ];

  const salesTips = [
    ...tipsPool[(countryHash % tipsPool.length)],
    `Leverage FedEx's ${fedexRank <= 3 ? 'market leadership' : 'growing presence'} to attract enterprise clients`,
    `Focus on cross-border shipping expertise as a differentiator in ${country}`
  ];

  const emailTemplate = `Subject: Enhance Your Shipping Efficiency in ${country} with FedEx

Dear [Prospect Name],

I hope this email finds you well. I'm reaching out to discuss how FedEx can optimize your shipping operations in ${country}.

**Market Insights:**
- Current shipping market in ${country}: €${(revenue / 1_000_000).toFixed(1)}M
- Total shipments: ${bookings.toLocaleString()}
- FedEx market share: 18.5% and growing

**Why FedEx?**
✓ Global network with reliable international connections
✓ Advanced tracking and visibility technology
✓ Express delivery options for time-sensitive shipments
✓ Dedicated account management and support

We've helped similar businesses in ${country} reduce shipping costs by 15-20% while improving delivery times. I'd love to schedule a brief call to discuss your specific needs and show you customized solutions.

Are you available for a 15-minute call next week?

Best regards,
[Your Name]
FedEx Sales Team

P.S. We're currently offering a promotional rate for new customers in ${country}. Let's explore how you can benefit!`;

  return {
    country,
    carriers,
    fedexSentiment,
    salesTips,
    emailTemplate,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Clear all cached insights
 */
export function clearInsightsCache(): void {
  const stats = cacheService.getStats();
  stats.keys
    .filter(key => key.startsWith('country_insights_'))
    .forEach(key => cacheService.remove(key));
}
