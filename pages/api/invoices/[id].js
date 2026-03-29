// pages/api/invoices/[id].js
import { query, queryOne, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

async function handler(req, res) {
  if (req.user.role !== 'admin' && req.user.role !== 'custom') return res.status(403).json({ error:'Admin only' });
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const inv = await queryOne('SELECT * FROM invoices WHERE id=?', [id]);
      if (!inv) return res.status(404).json({ error:'Not found' });
      const items = await query('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY sort_order,id', [id]);
      return res.json({ ...inv, items });
    } catch(e) { return res.status(500).json({ error:e.message }); }
  }

  if (req.method === 'PUT') {
    const {
      type, recipient_type, recipient_id, recipient_name, recipient_email,
      recipient_phone, recipient_address, application_id, student_id,
      university_name, program_name, intake, issue_date, due_date, status,
      subtotal=0, tax_rate=0, discount_amount=0, currency, notes,
      payment_method, payment_date, payment_ref, items=[]
    } = req.body;
    try {
      const tax_amount = (parseFloat(subtotal)||0)*(parseFloat(tax_rate)||0)/100;
      const total = (parseFloat(subtotal)||0)-(parseFloat(discount_amount)||0)+tax_amount;
      await query(`
        UPDATE invoices SET type=?,recipient_type=?,recipient_id=?,recipient_name=?,
          recipient_email=?,recipient_phone=?,recipient_address=?,application_id=?,
          student_id=?,university_name=?,program_name=?,intake=?,
          issue_date=?,due_date=?,status=?,subtotal=?,tax_rate=?,tax_amount=?,
          discount_amount=?,total=?,currency=?,notes=?,
          payment_method=?,payment_date=?,payment_ref=?
        WHERE id=?
      `, [
        type, recipient_type, recipient_id||null, recipient_name,
        recipient_email||null, recipient_phone||null, recipient_address||null,
        application_id||null, student_id||null, university_name||null, program_name||null, intake||null,
        issue_date, due_date||null, status,
        subtotal, tax_rate, tax_amount, discount_amount, total, currency,
        notes||null, payment_method||null, payment_date||null, payment_ref||null, id
      ]);
      const pool = getPool();
      await pool.execute('DELETE FROM invoice_items WHERE invoice_id=?', [id]);
      for (let i=0; i<items.length; i++) {
        const item = items[i];
        if (!item.description) continue;
        const amt = (parseFloat(item.quantity)||1)*(parseFloat(item.unit_price)||0);
        await pool.execute(
          'INSERT INTO invoice_items (invoice_id,description,quantity,unit_price,amount,sort_order) VALUES (?,?,?,?,?,?)',
          [id, item.description, item.quantity||1, item.unit_price||0, amt, i]
        );
      }
      return res.json({ message:'Updated' });
    } catch(e) { return res.status(500).json({ error:e.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const pool = getPool();
      await pool.execute('DELETE FROM invoice_items WHERE invoice_id=?', [id]);
      await pool.execute('DELETE FROM invoices WHERE id=?', [id]);
      return res.json({ message:'Deleted' });
    } catch(e) { return res.status(500).json({ error:e.message }); }
  }
  return res.status(405).json({ error:'Method not allowed' });
}
export default withAuth(handler, ['admin']);