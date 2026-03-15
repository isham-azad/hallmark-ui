export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

function parseCSV(text: string): { sku: string; price: string; wasPrice: string }[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase();
  const cols = header.split(",").map((c) => c.trim().replace(/^"|"$/g, "").toLowerCase());
  const skuIdx = cols.findIndex((c) => c === "sku");
  const priceIdx = cols.findIndex((c) => c === "price");
  const wasPriceIdx = cols.findIndex((c) => c === "wasprice" || c === "was_price" || c === "was price");
  const rows: { sku: string; price: string; wasPrice: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const sku = (cells[skuIdx] ?? "").trim();
    const price = (cells[priceIdx] ?? "").trim();
    const wasPrice = (cells[wasPriceIdx ?? -1] ?? "").trim();
    if (!sku) continue;
    rows.push({ sku, price: price || "0", wasPrice: wasPrice || "" });
  }
  return rows;
}

async function handler(request: Request, { logAction }: { logAction: any }) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "No CSV file provided." },
        { status: 400 }
      );
    }
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "CSV has no valid rows. Use header: sku,price,wasPrice" },
        { status: 400 }
      );
    }

    const snapshot = await db.collection("products").get();
    const bySku: Record<string, { id: string }> = {};
    snapshot.docs.forEach((doc: any) => {
      const sku = (doc.data().sku as string)?.trim?.();
      if (sku) bySku[sku] = { id: doc.id };
    });

    const errors: string[] = [];
    let updated = 0;
    const BATCH_SIZE = 500;
    let batch = db.batch();
    let ops = 0;

    for (const row of rows) {
      const ref = bySku[row.sku];
      if (!ref) {
        errors.push(`SKU not found: ${row.sku}`);
        continue;
      }
      const priceStr = row.price || "0";
      const wasPriceStr = row.wasPrice ? row.wasPrice : null;
      batch.update(db.collection("products").doc(ref.id), {
        price: priceStr,
        wasPrice: wasPriceStr,
        updatedAt: FieldValue.serverTimestamp(),
      });
      updated++;
      ops++;
      if (ops >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }

    if (ops > 0) await batch.commit();

    revalidatePath("/admin/products/prices");

    await logAction("BULK_PRICE_UPDATE", { updatedCount: updated, errorCount: errors.length });

    return NextResponse.json({
      success: true,
      updated,
      errors: errors.slice(0, 50),
    });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_PRICES);
