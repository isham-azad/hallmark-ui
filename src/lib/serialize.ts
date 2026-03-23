/**
 * Serializes Firestore data to prevent "Only plain objects can be passed to Client Components" error.
 * Converts Firestore Timestamps to ISO strings and handles nested arrays/objects.
 */
export function serializeData(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(serializeData);
    }
    
    // Handle objects
    if (typeof obj === "object") {
        // Specifically check for Firestore Timestamp using common internal properties
        if ("_seconds" in obj && "_nanoseconds" in obj) {
            return new Date(obj._seconds * 1000).toISOString();
        }
        
        // Check for .toDate() method (common in SDK for Timestamps)
        if (typeof obj.toDate === "function") {
            return obj.toDate().toISOString();
        }
        
        // Recursively serialize other objects
        const out: any = {};
        for (const key of Object.keys(obj)) {
            out[key] = serializeData(obj[key]);
        }
        return out;
    }
    
    // Pass primitives through
    return obj;
}
