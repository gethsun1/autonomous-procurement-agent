import { VendorScore } from "./GeminiEvaluator";

export interface DecisionConstraints {
    maxBudget: number;
    minQualityScore: number;
    preferredSLA: number;
}

export interface ValidationResult {
    isValid: boolean;
    selectedVendor: VendorScore | null;
    violations: string[];
    decisionHash: string;
}

/**
 * Validates Gemini evaluation results against hard constraints
 * This ensures deterministic execution regardless of AI output
 */
export class DecisionValidator {
    /**
     * Validate evaluation and select best vendor
     */
    validate(
        vendorScores: VendorScore[],
        constraints: DecisionConstraints
    ): ValidationResult {
        const violations: string[] = [];

        // Filter vendors that meet all constraints
        const validVendors = vendorScores.filter((vendor) => {
            if (!vendor.meetsConstraints) {
                violations.push(
                    `${vendor.vendorName} does not meet basic constraints`
                );
                return false;
            }

            // Additional validation checks
            if (vendor.qualityScore < constraints.minQualityScore) {
                violations.push(
                    `${vendor.vendorName} quality score ${vendor.qualityScore} < required ${constraints.minQualityScore}`
                );
                return false;
            }

            return true;
        });

        // Select best vendor from valid options
        const selectedVendor = validVendors.length > 0 ? validVendors[0] : null;

        // Generate decision hash (commitment)
        const decisionHash = this.generateDecisionHash(
            selectedVendor,
            vendorScores,
            constraints
        );

        return {
            isValid: selectedVendor !== null,
            selectedVendor,
            violations,
            decisionHash,
        };
    }

    /**
     * Generate cryptographic commitment to decision
     */
    private generateDecisionHash(
        selectedVendor: VendorScore | null,
        allScores: VendorScore[],
        constraints: DecisionConstraints
    ): string {
        const crypto = require("crypto");

        const decisionData = {
            selectedVendorId: selectedVendor?.vendorId || "none",
            timestamp: new Date().toISOString(),
            constraints,
            topThreeScores: allScores.slice(0, 3).map((v) => ({
                id: v.vendorId,
                score: v.totalScore,
            })),
        };

        const hash = crypto
            .createHash("sha256")
            .update(JSON.stringify(decisionData))
            .digest("hex");

        return `0x${hash}`;
    }

    /**
     * Verify if a decision meets all requirements
     */
    verifyDecision(
        vendorId: string,
        amount: number,
        constraints: DecisionConstraints
    ): boolean {
        // Verify amount is within budget
        if (amount > constraints.maxBudget) {
            console.error("Payment amount exceeds budget");
            return false;
        }

        // Additional verification checks can be added here

        return true;
    }
}
