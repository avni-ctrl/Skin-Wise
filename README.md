# SkinWise

*Know your skin. Know your products.*

A luxury skincare-intelligence website: read ingredients (Formula Lab), build an AM/PM routine (Skin Garden), track your shelf and expiries (Product Museum), and find cheaper matches (Find a Dupe) — all powered by one saved skin profile and a founder-curated Supabase ingredient database.

## Stack

React 19 + Vite 7 · Tailwind CSS 4 · Framer Motion · @react-three/fiber (homepage 3D descent, desktop only) · Canvas 2D living backdrops · SVG goo-filter liquid blob · Supabase (auth + Postgres + private storage).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
```

`.env` needs (already configured, git-ignored):

```
VITE_SUPABASE_URL=…
VITE_SUPABASE_ANON_KEY=…   # publishable key ONLY — never the service-role key
```

## The data spine (Supabase project: SkinWise Project)

Catalog tables (public read): `brands` (274), `ingredients` (143, with active/comedogenic/fragrance/oxidizing/harmful-for flags), `products` (595, ₹ prices + PAO + heat-adjusted PAO), `product_ingredients` (~2.5k links), `conflict_pairs` (24, with severity/explanation/fix), `treatment_ingredient_warnings`.

User tables (RLS owner-only, keyed to `auth.uid()`): `users` (profile), `user_routine`, `user_shelf`, `user_treatments`, `user_harmful_ingredients`, `progress_photos` (+ private `progress-photos` storage bucket).

**RLS is ON for every table** with policies applied by migration `rls_policies_catalog_and_user_tables` — re-verify in the dashboard before launch.

Service functions (real rows, no stubs — each is the seam for a future external API):

- `getProductVerdict(productId, profile, routine)` → score/label, key ingredients, conflicts vs the user's actual routine, city-aware shelf-life, week-by-week timeline — [src/services/verdict.js](src/services/verdict.js)
- `checkRoutineConflicts(routine)` → [src/services/conflicts.js](src/services/conflicts.js)
- `findDupes(productId)` → ranked same-category, cheaper-first matches — [src/services/dupes.js](src/services/dupes.js)

### Notes for the founder

- `product_ingredients` was seeded heuristically (name keywords + category-typical bases). Refine per-product in the dashboard; the app reads whatever is there.
- 571/595 products have no `price_inr` yet — dupe cards show "price not on record" until filled.
- Email confirmation is currently ON in Supabase Auth. Quiz signups therefore wait for the email link; the profile is stashed locally and written on first sign-in. Turn OFF "Confirm email" (Auth → Providers → Email) for instant accounts.

## Craft map

- Serum-drip page transition: [src/components/PageTransition.jsx](src/components/PageTransition.jsx)
- Living backdrop (per-route grades, AM/PM light, conflict flashes): [src/components/Backdrop.jsx](src/components/Backdrop.jsx)
- Appendix-B liquid blob + goo filter: [src/components/LiquidBackdrop.jsx](src/components/LiquidBackdrop.jsx)
- 3D descent through skin: [src/components/SkinDescent.jsx](src/components/SkinDescent.jsx) (lazy-loaded, capable desktops only)
- Shared motion language: [src/lib/easing.js](src/lib/easing.js)
- All expensive effects gate on `prefers-reduced-motion`, pointer type, viewport and device capability: [src/lib/usePrefs.js](src/lib/usePrefs.js)
