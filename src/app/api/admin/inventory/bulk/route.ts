export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import db from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { withAdminAuth } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";

function parseCSV(text: string): { sku: string; stock: number }[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase();
  const skuCol = header.includes("sku") ? header.split(",").indexOf("sku") : 0;
  const stockCol = header.includes("stock") ? header.split(",").indexOf("stock") : 1;
  const rows: { sku: string; stock: number }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const sku = cells[skuCol] ?? "";
    const stock = parseInt(cells[stockCol] ?? "0", 10);
    if (!sku) continue;
    rows.push({ sku, stock: isNaN(stock) ? 0 : Math.max(0, stock) });
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
        { success: false, error: "CSV has no valid rows. Use header: sku,stock" },
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
      batch.update(db.collection("products").doc(ref.id), {
        sku: row.sku,
        stock: row.stock,
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

    if (ops > 0) {
      await batch.commit();
    }

    revalidatePath("/admin/products/inventory");
    
    await logAction("BULK_INVENTORY_UPDATE", { updatedCount: updated, errorCount: errors.length });

    return NextResponse.json({
      success: true,
      updated,
      errors: errors.slice(0, 50),
    });
}

export const POST = withAdminAuth(handler, PERMISSIONS.MANAGE_INVENTORY);
