import fs from 'fs';
import path from 'path';

export class TestingLogger {
    private logDir: string;
    private currentSessionId: string;

    constructor() {
        this.logDir = path.join(process.cwd(), 'testing_logs');
        this.currentSessionId = new Date().toISOString().replace(/:/g, '-');

        // Ensure directory exists
        if (!fs.existsSync(this.logDir)) {
            try {
                fs.mkdirSync(this.logDir, { recursive: true });
            } catch (err) {
                console.error("Failed to create testing_logs directory:", err);
            }
        }
    }

    private getLogFilePath(): string {
        return path.join(this.logDir, `session_${this.currentSessionId}.log`);
    }

    public logEvent(workflowId: number | string, eventType: string, details: any = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = JSON.stringify({
            timestamp,
            workflowId,
            eventType,
            details
        });

        const formattedLog = `[${timestamp}] [Workflow ${workflowId}] [${eventType}]: ${JSON.stringify(details)}\n`;

        console.log(`📝 [TestingLogger] ${eventType} for Workflow ${workflowId}`);

        try {
            fs.appendFileSync(this.getLogFilePath(), formattedLog);

            // Also maintain a recent_events.json for the dashboard EventLogPanel to read if necessary
            this.updateRecentEventsJSON({
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                msg: `Workflow #${workflowId} ${eventType}`,
                type: this.determineEventType(eventType)
            });

        } catch (err) {
            console.error("TestingLogger failed to write to file:", err);
        }
    }

    private determineEventType(eventType: string): 'info' | 'success' | 'highlight' | 'warning' {
        const lower = eventType.toLowerCase();
        if (lower.includes('error') || lower.includes('fail')) return 'warning';
        if (lower.includes('payment') || lower.includes('escrow')) return 'highlight';
        if (lower.includes('complete') || lower.includes('settle') || lower.includes('success')) return 'success';
        return 'info';
    }

    private updateRecentEventsJSON(newEvent: any) {
        const jsonPath = path.join(this.logDir, 'recent_events.json');
        let events = [];
        try {
            if (fs.existsSync(jsonPath)) {
                events = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            }
            events.unshift(newEvent); // Add to beginning
            events = events.slice(0, 50); // Keep last 50 events
            fs.writeFileSync(jsonPath, JSON.stringify(events, null, 2));
        } catch (err) {
            console.error("TestingLogger failed to update recent_events.json:", err);
        }
    }

    public getRecentEvents() {
        const jsonPath = path.join(this.logDir, 'recent_events.json');
        try {
            if (fs.existsSync(jsonPath)) {
                return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            }
        } catch (err) {
            console.error("TestingLogger failed to read recent_events.json:", err);
        }
        return [];
    }
}

export const testingLogger = new TestingLogger();
