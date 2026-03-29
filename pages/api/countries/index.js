// pages/api/countries/index.js
import { withAuth } from '../../../lib/auth';

const FALLBACK_COUNTRIES = [
  { id:1,  name:'Pakistan',       code:'PK', flag:'🇵🇰' },
  { id:2,  name:'Canada',         code:'CA', flag:'🇨🇦' },
  { id:3,  name:'United Kingdom', code:'GB', flag:'🇬🇧' },
  { id:4,  name:'United States',  code:'US', flag:'🇺🇸' },
  { id:5,  name:'Australia',      code:'AU', flag:'🇦🇺' },
  { id:6,  name:'Germany',        code:'DE', flag:'🇩🇪' },
  { id:7,  name:'UAE',            code:'AE', flag:'🇦🇪' },
  { id:8,  name:'Turkey',         code:'TR', flag:'🇹🇷' },
  { id:9,  name:'Malaysia',       code:'MY', flag:'🇲🇾' },
  { id:10, name:'Singapore',      code:'SG', flag:'🇸🇬' },
  { id:11, name:'India',          code:'IN', flag:'🇮🇳' },
  { id:12, name:'Bangladesh',     code:'BD', flag:'🇧🇩' },
  { id:13, name:'France',         code:'FR', flag:'🇫🇷' },
  { id:14, name:'Netherlands',    code:'NL', flag:'🇳🇱' },
  { id:15, name:'New Zealand',    code:'NZ', flag:'🇳🇿' },
  { id:16, name:'Ireland',        code:'IE', flag:'🇮🇪' },
  { id:17, name:'Sweden',         code:'SE', flag:'🇸🇪' },
  { id:18, name:'Finland',        code:'FI', flag:'🇫🇮' },
  { id:19, name:'Norway',         code:'NO', flag:'🇳🇴' },
  { id:20, name:'Denmark',        code:'DK', flag:'🇩🇰' },
];

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { query } = await import('../../../lib/db');
    const countries = await query('SELECT id, name, code, flag FROM countries ORDER BY name');
    return res.json({ countries });
  } catch (err) {
    // DB not available — return inline fallback (no import needed)
    return res.json({ countries: FALLBACK_COUNTRIES });
  }
}

export default withAuth(handler);