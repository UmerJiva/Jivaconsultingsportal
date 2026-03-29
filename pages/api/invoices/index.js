// pages/api/invoices/index.js
import { query, queryOne, getPool } from '../../../lib/db';
import { withAuth } from '../../../lib/auth';

function makeInvoiceNo() {
  const y = new Date().getFullYear();
  const r = String(Math.floor(Math.random()*9000)+1000);
  return `INV-${y}-${r}`;
}

async function handler(req, res) {
  const role = req.user.role === 'custom' ? 'admin' : req.user.role;

  if (role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  if (req.method === 'GET') {
    const { search='', status='', recipient_type='', page='1', limit='20' } = req.query;
    const lim = Math.min(100, parseInt(limit)||20);
    const off = (Math.max(1,parseInt(page))-1)*lim;
    let where = 'WHERE 1=1';
    const params = [];
    if (status)         { where += ' AND i.status=?';        params.push(status); }
    if (recipient_type) { where += ' AND i.recipient_type=?'; params.push(recipient_type); }
    if (search) {
      where += ' AND (i.invoice_no LIKE ? OR i.recipient_name LIKE ? OR i.university_name LIKE ?)';
      const l=`%${search}%`; params.push(l,l,l);
    }
    try {
      const rows = await query(`
        SELECT i.*, COUNT(ii.id) AS item_count
        FROM invoices i
        LEFT JOIN invoice_items ii ON ii.invoice_id=i.id
        ${where} GROUP BY i.id ORDER BY i.created_at DESC LIMIT ? OFFSET ?
      `, [...params, lim, off]);
      const cntRows = await query(`SELECT COUNT(*) AS c FROM invoices i ${where}`, params);
      const cnt = cntRows[0]?.c || 0;
      const stats = await query('SELECT status, SUM(total) AS total_amount, COUNT(*) AS count FROM invoices GROUP BY status');
      return res.json({ invoices:rows, total:cnt, pages:Math.ceil(cnt/lim)||1, stats });
    } catch(e) {
      console.error('[invoices GET]', e.message);
      return res.json({ invoices:[], total:0, pages:1, stats:[] });
    }
  }

  if (req.method === 'POST') {
    const {
      type='commission', recipient_type='agent', recipient_id, recipient_name, recipient_email,
      recipient_phone, recipient_address, application_id, student_id,
      university_name, program_name, intake,
      issue_date, due_date, status='draft',
      subtotal=0, tax_rate=0, discount_amount=0, currency='USD',
      notes, payment_method, payment_date, payment_ref, items=[]
    } = req.body;
    if (!recipient_name || !issue_date) return res.status(400).json({ error:'recipient_name and issue_date required' });
    const tax_amount = (parseFloat(subtotal)||0) * (parseFloat(tax_rate)||0) / 100;
    const total = (parseFloat(subtotal)||0) - (parseFloat(discount_amount)||0) + tax_amount;
    const invoice_no = makeInvoiceNo();
    try {
      const pool = getPool();
      const [ins] = await pool.execute(`
        INSERT INTO invoices (invoice_no,type,recipient_type,recipient_id,recipient_name,recipient_email,
          recipient_phone,recipient_address,application_id,student_id,university_name,program_name,intake,
          issue_date,due_date,status,subtotal,tax_rate,tax_amount,discount_amount,total,currency,
          notes,payment_method,payment_date,payment_ref,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        invoice_no, type, recipient_type, recipient_id||null, recipient_name, recipient_email||null,
        recipient_phone||null, recipient_address||null, application_id||null, student_id||null,
        university_name||null, program_name||null, intake||null,
        issue_date, due_date||null, status,
        subtotal, tax_rate, tax_amount, discount_amount, total, currency,
        notes||null, payment_method||null, payment_date||null, payment_ref||null, req.user.id
      ]);
      for (let i=0; i<items.length; i++) {
        const item = items[i];
        if (!item.description) continue;
        const amt = (parseFloat(item.quantity)||1)*(parseFloat(item.unit_price)||0);
        await pool.execute(
          'INSERT INTO invoice_items (invoice_id,description,quantity,unit_price,amount,sort_order) VALUES (?,?,?,?,?,?)',
          [ins.insertId, item.description, item.quantity||1, item.unit_price||0, amt, i]
        );
      }
      return res.status(201).json({ message:'Invoice created', id:ins.insertId, invoice_no });
    } catch(e) {
      console.error('[invoices POST]', e.message);
      return res.status(500).json({ error: e.message });
    }
  }
  return res.status(405).json({ error:'Method not allowed' });
}
export default withAuth(handler, ['admin']);