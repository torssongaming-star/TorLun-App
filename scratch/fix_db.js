const { Client } = require('pg');

const password = 'dWub-fool!-baip2-krea?';
const projectRef = 'ixjrcrylfbxaosdawfcy';
const hosts = [
  `db.${projectRef}.supabase.co`,
  `aws-0-eu-central-1.pooler.supabase.com`,
  `aws-0-eu-north-1.pooler.supabase.com`
];

async function run() {
  for (const host of hosts) {
    console.log(`Trying host: ${host}`);
    const client = new Client({
      host: host,
      port: 5432,
      user: `postgres.${projectRef}`,
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`Connected to ${host}!`);
      
      const sql = `
        ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Manuell betalning';
        ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
        ALTER TABLE bills ADD COLUMN IF NOT EXISTS auto_create_next_month BOOLEAN DEFAULT FALSE;
        ALTER TABLE bills ADD COLUMN IF NOT EXISTS bankgiro_number TEXT;
        ALTER TABLE bills ADD COLUMN IF NOT EXISTS ocr_number TEXT;
        ALTER TABLE bills ADD COLUMN IF NOT EXISTS supplier_name TEXT;
        ALTER TABLE bills ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES budget_categories(id);
        NOTIFY pgrst, 'reload schema';
      `;
      
      await client.query(sql);
      console.log('Successfully updated schema and reloaded cache!');
      await client.end();
      return;
    } catch (err) {
      console.error(`Failed to connect to ${host}: ${err.message}`);
    }
  }
}

run();
