# مُكث — منصة حفظ القرآن الكريم

**Mukth** is a full-featured Arabic RTL Quran memorization platform landing page built with **React 18 + Vite + Tailwind CSS**.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Build for production
npm run build
```

---

## 📁 Project Structure

```
mukth-platform/
├── index.html                        # Entry HTML (RTL, lang=ar, Google Fonts)
├── vite.config.js
├── tailwind.config.js                # Brand colors + Arabic fonts
├── postcss.config.js
└── src/
    ├── main.jsx                      # React entry point
    ├── index.css                     # Global styles, keyframes, utility classes
    ├── App.jsx                       # Root — assembles all sections
    └── components/
        ├── Navbar.jsx                # Sticky RTL navbar (transparent → glassmorphism)
        ├── HeroSection.jsx           # Full-viewport hero, Islamic pattern, stats
        ├── StatsBar.jsx              # Emerald trust-stats band
        ├── AboutSection.jsx          # Who we are + values grid
        ├── CurriculaSection.jsx      # 4 course cards (Kids, Adults, Ijazah, Tajweed)
        ├── HowItWorks.jsx            # 4-step enrollment process
        ├── PricingSection.jsx        # Monthly plans with logo marks (like reference)
        ├── TeachersSection.jsx       # Teacher grid with avatars (like reference)
        ├── TestimonialsSection.jsx   # Student reviews on dark bg
        ├── ContactSection.jsx        # WhatsApp CTA + contact form + social links
        ├── Footer.jsx                # Full sitemap footer + verse
        ├── ScrollToTop.jsx           # Floating scroll-to-top button
        ├── WhatsAppFAB.jsx           # Floating WhatsApp button
        └── shared/
            ├── tokens.js             # ⭐ ALL design tokens, data, colors — edit here
            ├── IslamicPattern.jsx    # Reusable SVG geometric pattern
            └── RegisterModal.jsx     # Lead-gen modal (Name, Phone, Email, Curriculum)
```

---

## ⚙️ Configuration — Before Launch

### 1. Replace WhatsApp Number
Open `src/components/shared/tokens.js` and update:
```js
export const WHATSAPP_NUMBER = '201000000000'; // ← Your real number
```

### 2. Update Contact Info
In `src/components/ContactSection.jsx` and `src/components/Footer.jsx`, update:
- Email address
- Phone number
- Social media links
- Office address

### 3. Update Teacher & Pricing Data
All content lives in `src/components/shared/tokens.js`:
- `CURRICULA` — course cards
- `PLANS` — pricing plans + prices
- `TEACHERS` — teacher profiles
- `TESTIMONIALS` — student reviews

### 4. Replace Video Placeholder
In `src/components/HeroSection.jsx`, find the video placeholder div and replace with:
```jsx
<video src="/your-intro.mp4" controls poster="/thumbnail.jpg" />
// OR embed a YouTube iframe
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary Green | `#064e3b` |
| Primary Dark  | `#011a12` |
| Gold/Sand      | `#d4af37` |
| Gold Dark      | `#b8941f` |
| Off-white BG   | `#fafaf8` |
| Muted Text     | `#4a6358` |
| Display Font   | IBM Plex Sans Arabic |
| Body Font      | Tajawal |
| Quranic Text   | Amiri |

---

## 📱 Responsive

- **Mobile-first** layout throughout
- RTL fully supported via `dir="rtl"` and `direction: rtl`
- Navbar collapses to hamburger drawer on mobile
- All grids use `auto-fit` for fluid responsiveness

---

## 🛠 Tech Stack

- **React 18** — component architecture
- **Vite 5** — lightning-fast dev server
- **Tailwind CSS 3** — utility styling
- **Pure CSS animations** — no Framer Motion dependency (zero extra bundle weight)

---

*صُنع لوجه الله — جميع الحقوق محفوظة لمنصة مُكث*
