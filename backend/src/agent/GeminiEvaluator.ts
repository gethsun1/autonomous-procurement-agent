import { GoogleGenerativeAI } from "@google/generative-ai";
import { Vendor } from "../data/VendorData";

export interface EvaluationCriteria {
    maxBudget: number;
    minQualityScore: number;
    preferredSLA: number;
    durationDays: number;
}

export interface VendorScore {
    vendorId: string;
    vendorName: string;
    totalScore: number;
    costScore: number;
    qualityScore: number;
    slaScore: number;
    reasoning: string;
    meetsConstraints: boolean;
}

export interface EvaluationResult {
    rankedVendors: VendorScore[];
    recommendation: string;
    timestamp: string;
}

export class GeminiEvaluator {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    }

    /**
     * Evaluate and rank vendors using Gemini AI
     */
    async evaluateVendors(
        procurementBrief: string,
        vendors: Vendor[],
        criteria: EvaluationCriteria
    ): Promise<EvaluationResult> {
        const prompt = this.buildEvaluationPrompt(
            procurementBrief,
            vendors,
            criteria
        );

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse JSON response
            const evaluation = this.parseGeminiResponse(text, vendors, criteria);

            return {
                rankedVendors: evaluation,
                recommendation: this.generateRecommendation(evaluation),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error("Gemini evaluation error:", error);
            throw new Error("Failed to evaluate vendors with Gemini AI");
        }
    }

    /**
     * Build structured prompt for Gemini
     */
    private buildEvaluationPrompt(
        procurementBrief: string,
        vendors: Vendor[],
        criteria: EvaluationCriteria
    ): string {
        const vendorList = vendors.map((v, idx) => `
${idx + 1}. ${v.name}
   - Price: $${v.pricePerMonth}/month
   - SLA: ${v.sla}% uptime
   - Reputation Score: ${v.reputationScore}/10
   - Features: ${v.features.join(", ")}
   - Description: ${v.description}
    `).join("\n");

        return `You are an enterprise procurement analyst AI evaluating vendor proposals.

PROCUREMENT REQUEST:
"${procurementBrief}"

EVALUATION CRITERIA:
- Maximum Budget: $${criteria.maxBudget} (for ${criteria.durationDays} days)
- Minimum Quality Score Required: ${criteria.minQualityScore}/10
- Preferred SLA: ${criteria.preferredSLA}% uptime

AVAILABLE VENDORS:
${vendorList}

TASK:
Evaluate each vendor and provide a structured JSON response with the following format:

{
  "vendors": [
    {
      "vendorId": "vendor_1",
      "vendorName": "Vendor Name",
      "costScore": 0-10,
      "qualityScore": 0-10,
      "slaScore": 0-10,
      "totalScore": 0-10,
      "reasoning": "Brief explanation of scores",
      "meetsConstraints": true/false
    }
  ]
}

SCORING GUIDELINES:
1. **Cost Score**: Higher score for lower price within budget (0 if over budget)
2. **Quality Score**: Based on reputation, features, and service quality
3. **SLA Score**: Based on uptime guarantee relative to requirement
4. **Total Score**: Weighted average (40% cost, 35% quality, 25% SLA)
5. **Meets Constraints**: true only if under budget and meets minimum quality

IMPORTANT:
- A vendor that exceeds the maximum budget MUST have meetsConstraints = false
- Rank vendors by totalScore (highest first)
- Be objective and data-driven
- Provide concise reasoning for each vendor

Return ONLY the JSON object, no additional text.`;
    }

    /**
     * Parse Gemini response into structured evaluation
     */
    private parseGeminiResponse(
        responseText: string,
        vendors: Vendor[],
        criteria: EvaluationCriteria
    ): VendorScore[] {
        try {
            // Extract JSON from response (Gemini may wrap in markdown)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("No JSON found in response");
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const vendorScores = parsed.vendors || [];

            // Validate and enforce constraints
            return vendorScores.map((score: any) => {
                const vendor = vendors.find((v) => v.id === score.vendorId);
                if (!vendor) {
                    throw new Error(`Vendor ${score.vendorId} not found`);
                }

                // Calculate cost for duration
                const totalCost = (vendor.pricePerMonth * criteria.durationDays) / 30;

                // Hard constraint validation (override Gemini if needed)
                const meetsConstraints =
                    totalCost <= criteria.maxBudget &&
                    score.qualityScore >= criteria.minQualityScore;

                return {
                    vendorId: score.vendorId,
                    vendorName: score.vendorName || vendor.name,
                    totalScore: parseFloat(score.totalScore) || 0,
                    costScore: parseFloat(score.costScore) || 0,
                    qualityScore: parseFloat(score.qualityScore) || 0,
                    slaScore: parseFloat(score.slaScore) || 0,
                    reasoning: score.reasoning || "No reasoning provided",
                    meetsConstraints,
                };
            });
        } catch (error) {
            console.error("Failed to parse Gemini response:", error);
            console.error("Response text:", responseText);
            throw new Error("Invalid response format from Gemini");
        }
    }

    /**
     * Generate recommendation summary
     */
    private generateRecommendation(scores: VendorScore[]): string {
        const validVendors = scores.filter((s) => s.meetsConstraints);

        if (validVendors.length === 0) {
            return "No vendors meet the specified constraints. Consider adjusting budget or quality requirements.";
        }

        const topVendor = validVendors[0];
        return `Recommended: ${topVendor.vendorName} (Score: ${topVendor.totalScore.toFixed(1)}/10). ${topVendor.reasoning}`;
    }
}
