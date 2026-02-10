/**
 * Mock vendor data for procurement simulation
 */

export interface Vendor {
    id: string;
    name: string;
    description: string;
    serviceType: string;
    pricePerMonth: number;
    sla: number; // Percentage uptime
    reputationScore: number; // Out of 10
    features: string[];
    contactEmail: string;
}

export const MOCK_VENDORS: Vendor[] = [
    {
        id: "vendor_1",
        name: "ChainMetrics Pro",
        description: "Enterprise blockchain analytics and monitoring API",
        serviceType: "blockchain_analytics",
        pricePerMonth: 450,
        sla: 99.9,
        reputationScore: 9.2,
        features: [
            "Real-time transaction monitoring",
            "Multi-chain support (50+ chains)",
            "Advanced wallet analysis",
            "Custom alerts and webhooks",
            "Historical data access (3 years)",
        ],
        contactEmail: "sales@chainmetrics.io",
    },
    {
        id: "vendor_2",
        name: "BlockInsight API",
        description: "Comprehensive blockchain data and intelligence platform",
        serviceType: "blockchain_analytics",
        pricePerMonth: 380,
        sla: 99.5,
        reputationScore: 8.8,
        features: [
            "Transaction tracking",
            "Smart contract analysis",
            "DeFi protocol metrics",
            "NFT market data",
            "API rate limit: 10k req/min",
        ],
        contactEmail: "contact@blockinsight.com",
    },
    {
        id: "vendor_3",
        name: "CryptoData Hub",
        description: "Affordable blockchain analytics for startups",
        serviceType: "blockchain_analytics",
        pricePerMonth: 280,
        sla: 98.5,
        reputationScore: 7.5,
        features: [
            "Basic transaction data",
            "5 supported chains",
            "Daily data updates",
            "Standard API access",
            "Email support",
        ],
        contactEmail: "support@cryptodatahub.com",
    },
    {
        id: "vendor_4",
        name: "OmniChain Analytics",
        description: "Premium multi-chain analytics with AI insights",
        serviceType: "blockchain_analytics",
        pricePerMonth: 650,
        sla: 99.95,
        reputationScore: 9.8,
        features: [
            "AI-powered anomaly detection",
            "100+ blockchain networks",
            "Real-time streaming data",
            "Custom data pipelines",
            "24/7 priority support",
            "Dedicated account manager",
        ],
        contactEmail: "enterprise@omnichain.ai",
    },
    {
        id: "vendor_5",
        name: "DataChain Essentials",
        description: "Cost-effective blockchain data API for developers",
        serviceType: "blockchain_analytics",
        pricePerMonth: 199,
        sla: 97.0,
        reputationScore: 6.9,
        features: [
            "Basic API endpoints",
            "3 major chains supported",
            "Rate limit: 1k req/min",
            "Community support",
            "Documentation portal",
        ],
        contactEmail: "hello@datachain.dev",
    },
];

/**
 * Get all available vendors
 */
export function getAllVendors(): Vendor[] {
    return MOCK_VENDORS;
}

/**
 * Get vendor by ID
 */
export function getVendorById(id: string): Vendor | undefined {
    return MOCK_VENDORS.find((vendor) => vendor.id === id);
}

/**
 * Filter vendors by price range
 */
export function getVendorsByPriceRange(
    minPrice: number,
    maxPrice: number
): Vendor[] {
    return MOCK_VENDORS.filter(
        (vendor) =>
            vendor.pricePerMonth >= minPrice && vendor.pricePerMonth <= maxPrice
    );
}

/**
 * Filter vendors by minimum SLA
 */
export function getVendorsByMinSLA(minSLA: number): Vendor[] {
    return MOCK_VENDORS.filter((vendor) => vendor.sla >= minSLA);
}
