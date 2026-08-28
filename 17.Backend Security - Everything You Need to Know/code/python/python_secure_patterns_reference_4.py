async def get_invoice(invoice_id: int, current_user_id: int):
    # ✅ ownership check IN the query — not after
    row = await db.fetchrow(
        "SELECT * FROM invoices WHERE id=$1 AND user_id=$2",
        invoice_id, current_user_id
    )
    if not row:
        # 404 — not 403. Don't confirm the invoice exists.
        raise HTTPException(404, "invoice not found")
    return row
