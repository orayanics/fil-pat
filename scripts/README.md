# Scripts README

## Database Seeding Scripts

### 1. Initial Database Seed (`src/lib/database/seed.ts`)

**Purpose:** Sets up the initial database with user accounts and app settings.

**What it creates:**
- ✅ Admin account (username: `admin`, password: `admin123`)
- ✅ Test clinician account (username: `clinician`, password: `clinician123`)
- ✅ 8 Application settings

**Usage:**
```bash
npm run db:seed
```

**Note:** This does NOT create assessment templates. Templates are clinician-specific and should be created separately.

---

### 2. Template Seeding Script (`scripts/seedTemplates.ts`)

**Purpose:** Creates comprehensive assessment templates (76 items each) for a specific clinician.

**What it creates:**
- ✅ **Standard Template** - Complete Filipino Phonological Assessment (76 items)
  - All consonants: m, b, p, n, d, w, j, h, t, ŋ, k, g, ʔ, l, s, r, ʃ, ʧ, dʒ, f, v, z
  - All diphthongs: aj, ej, ɔj, aw, iw
  - Marked as default template
  
- ✅ **Kids Template** - Same 76 items, child-friendly interface
  - Identical assessment items
  - Marked for kids mode (visual themes)

**Usage:**

```bash
# For specific clinician ID (recommended)
npm run db:seed:templates [clinician_id]

# Example: Create templates for clinician ID 1
npm run db:seed:templates 1

# Or run directly
npx tsx scripts/seedTemplates.ts 1

# Without ID - uses first available clinician
npm run db:seed:templates
```

**Important:** Templates are tied to the clinician who creates them. Each clinician should have their own templates.

---

## Typical Workflow

### For Fresh Installation:

```bash
# 1. Run Prisma migrations
npm run db:migrate

# 2. Seed initial data (accounts + settings)
npm run db:seed

# 3. Create templates for admin (ID: 1)
npm run db:seed:templates 1

# 4. Create templates for test clinician (ID: 2)
npm run db:seed:templates 2
```

### For Electron Fresh Install:

The Electron app automatically runs steps 1-2 on first launch. Then clinicians can:

1. **Login** with admin or clinician account
2. **Run template seed** from within the app (future feature) or manually:
   ```bash
   npm run db:seed:templates [their_clinician_id]
   ```

---

## Script Comparison

| Feature | `seed.ts` | `seedTemplates.ts` |
|---------|-----------|-------------------|
| **Creates accounts** | ✅ Yes | ❌ No |
| **Creates templates** | ❌ No | ✅ Yes (2 templates) |
| **Creates items** | ❌ No | ✅ Yes (152 total) |
| **Requires clinician** | ❌ No | ✅ Yes |
| **Run on fresh install** | ✅ Auto | ⚠️ Manual |
| **Owner** | N/A | Specific clinician |

---

## Template Ownership

**Why templates are clinician-specific:**
- Each clinician can customize their assessment items
- Templates are not shared by default
- Allows for individual clinical preferences
- Clinician can create, edit, and manage their own templates

**Database relationship:**
```
Clinician (1) ──creates──> (N) AssessmentTemplate (1) ──contains──> (N) SessionItem
```

---

## File Locations

```
fil-pat/
├── src/lib/database/
│   └── seed.ts                    # Initial database seed (accounts + settings)
├── scripts/
│   ├── seedTemplates.ts           # Template seeding (76 items × 2 templates)
│   └── createTemplates.ts         # OLD - Legacy script (deprecated)
```

---

## Assessment Data

All 76 items cover:

**Consonants (21):**
- Bilabial: m, b, p
- Alveolar: n, d, t, s, l, r
- Palatal: j, ʃ, ʧ, dʒ
- Velar: k, g, ŋ
- Glottal: h, ʔ
- Labiodental: f, v
- Alveolar: z

**Diphthongs (5):**
- aj (bahay), ej (baby), ɔj (baboy), aw (sabaw), iw (sisiw)

Each item includes:
- Filipino question
- IPA transcription
- Expected response
- Image URL
- Difficulty level
- Consonant/vowel counts
- Sound pattern classification

---

## Future Enhancements

- [ ] In-app UI for template seeding
- [ ] Template import/export functionality
- [ ] Template sharing between clinicians
- [ ] Custom template builder
- [ ] Item bank system
- [ ] Multi-language support

---

**Last Updated:** December 2, 2025
