# TorLund App - Installation & Setup

## 1. Lokala förberedelser
För att köra appen lokalt:
1. Installera beroenden: `npm install`
2. Starta utvecklingsservern: `npm run dev`
3. Öppna [http://localhost:3000](http://localhost:3000)

## 2. Environment Variables (.env.local)
Skapa en `.env.local` i rotmappen med följande innehåll:

```env
# Supabase (Krävs)
NEXT_PUBLIC_SUPABASE_URL=din_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_anon_key

# Lunar Bank (Valfritt för test)
LUNAR_MODE=mock # 'mock', 'sandbox' eller 'production'
NEXT_PUBLIC_USE_MOCK_BANK=true # För att se mock-data i banking-flödet
LUNAR_TOKEN_ENCRYPTION_KEY=din_32_tecken_hex_nyckel

# För riktig Lunar-koppling (Krävs endast i sandbox/production)
LUNAR_CLIENT_ID=...
LUNAR_CLIENT_SECRET=...
LUNAR_REDIRECT_URI=http://localhost:3000/api/lunar/callback
LUNAR_CERT_PATH=./certs/qwac.pem
LUNAR_KEY_PATH=./certs/qwac.key
```

## 3. Supabase Setup
1. Gå till din Supabase-dashboard.
2. Öppna **SQL Editor**.
3. Kopiera innehållet från [supabase_schema.sql](file:///c:/Users/emil.torsson/.gemini/antigravity/scratch/TorLund%20App/supabase_schema.sql) och kör det.
4. Detta skapar alla tabeller (`profiles`, `bills`, `monthly_incomes`, `lunar_connections`, etc.) och sätter upp RLS-policies.

## 4. Vad som är klart
*   **Dashboard**: Full översikt med nettoinkomst, räkningar och "kvar att leva på".
*   **Månadshantering**: Möjlighet att bläddra mellan månader och sätta unik inkomst per månad.
*   **Räkningshantering**: Lägg till, ta bort och bocka av räkningar (manuellt eller via bank-matchning).
*   **Lunar-integration**:
    *   Färdig motor för att matcha banktransaktioner mot räkningar.
    *   Gränssnitt för att godkänna/ignorera matchningar.
    *   Säker OAuth2-hantering med krypterad token-lagring.
*   **Mobilanpassning**: Hela gränssnittet är responsivt.
*   **Tester**: Automatiserade tester för kärnlogiken (körs med `npm test`).

## 5. Återstår för riktig Lunar-koppling
För att gå live med riktig bankdata mot Lunar krävs:
1. **TPP-registrering**: Du måste vara registrerad som Third Party Provider hos Lunar.
2. **eIDAS-certifikat**: Giltiga QWAC och QSealC certifikat för mTLS-kommunikation.
3. **Produktions-credentials**: Client ID och Secret från Lunars developer portal.
4. **Hosting**: Appen måste köras på en publik URL som matchar din `LUNAR_REDIRECT_URI`.

---
**Appen är nu auditerad och verifierad utan TypeScript-fel eller trasiga länkar.**
Kör `npm test` för att verifiera logiken!
