import * as crypto from "crypto";

export interface EncryptedData {
    encrypted: Buffer;
    iv: Buffer;
    tag: Buffer;
}

/**
 * Handles encryption/decryption for privacy-preserving constraints
 * Simplified implementation for hackathon demo
 */
export class EncryptionService {
    private algorithm = "aes-256-gcm";
    private key: Buffer;

    constructor(secretKey?: string) {
        // In production, this should be derived from SKALE BITE
        const key = secretKey || process.env.ENCRYPTION_KEY || "default-demo-key-32-characters!!";
        this.key = crypto.createHash("sha256").update(key).digest();
    }

    /**
     * Encrypt sensitive data (budget, weights, etc.)
     */
    encrypt(data: any): EncryptedData {
        const plaintext = JSON.stringify(data);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        let encrypted = cipher.update(plaintext, "utf8");
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const tag = (cipher as any).getAuthTag();

        return {
            encrypted,
            iv,
            tag,
        };
    }

    /**
     * Decrypt data
     */
    decrypt(encryptedData: EncryptedData): any {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.key,
            encryptedData.iv
        );

        (decipher as any).setAuthTag(encryptedData.tag);

        let decrypted = decipher.update(encryptedData.encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return JSON.parse(decrypted.toString("utf8"));
    }

    /**
     * Convert encrypted data to buffer for blockchain storage
     */
    toBuffer(encryptedData: EncryptedData): Buffer {
        // Format: [iv (16 bytes)] [tag (16 bytes)] [encrypted data]
        return Buffer.concat([
            encryptedData.iv,
            encryptedData.tag,
            encryptedData.encrypted,
        ]);
    }

    /**
     * Parse buffer back to encrypted data structure
     */
    fromBuffer(buffer: Buffer): EncryptedData {
        const iv = buffer.slice(0, 16);
        const tag = buffer.slice(16, 32);
        const encrypted = buffer.slice(32);

        return { iv, tag, encrypted };
    }
}
