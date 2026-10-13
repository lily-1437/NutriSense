# NutriSense

**A Cloud-Based, AI-Driven System for Recipe Analysis & Nutritious Meal Planning**

🔗 **Live Demo:** [View the website](https://nutri-sense-snowy.vercel.app/)

---

## 📖 About the Project

NutriSense is a condition-aware nutrition analysis and meal planning web app. Users paste in any free-text recipe, and NutriSense breaks it into ingredients, matches them against a nutrition database, calculates the nutritional breakdown, and flags anything risky for the user's health condition. It then suggests safer substitutions and generates personalized weekly meal plans and health goals.

It supports 13 health conditions, including diabetes, hypertension, chronic kidney disease, and polycystic ovary syndrome (PCOS).

## ❗ Problem It Solves

People with diet-related chronic illnesses must decide at every meal whether their food fits their condition, but they rarely have a nutritionist on hand. Existing tools fall short in several ways:

- **Only totals, no risk:** most nutrition apps just count calories and nutrients without checking what they mean for a specific condition.
- **Rigid input:** many apps force users to pick from a fixed recipe list instead of typing their own recipe.
- **Unreliable data:** food databases are often inaccurate or not localized, so healthcare professionals don't trust them.
- **Heavy infrastructure:** research systems often need large server-side training data or clinician-administered tests.

**NutriSense addresses this by:**

- Accepting **free-text recipes** and parsing them automatically
- Matching ingredients to a **USDA-style database supplemented with regional ingredients**
- Flagging **condition-specific health risks** with warnings and ingredient substitutions
- Running all logic **in the browser**, with no custom backend server
- Using generative AI **only for classification and narrative text**, never for unrestricted medical advice, which keeps the system auditable and safe

## ✨ Key Features

- Free-text recipe parsing with fuzzy ingredient matching
- Automatic nutrition calculation (calories, protein, carbs, fat, sugar, fiber, sodium, vitamins)
- Condition-aware risk flags with badges and advisories
- Safer ingredient substitution suggestions
- Recipe classification: Healthy / Moderate / Unhealthy
- Personalized weekly meal plans
- Health goal setting with AI-generated milestones
- Progress dashboard and nutrition report export
- "What-if" recipe simulation

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React single-page application (JavaScript, HTML, CSS) |
| Parsing & matching | Deterministic client-side logic with fuzzy string matching |
| Classifier | Logistic regression (one-vs-rest), bundled at build time |
| Generative AI | Google Gemini via Google AI Studio REST API (classification and narrative only) |
| Authentication & database | Firebase (Backend-as-a-Service with NoSQL document storage) |
| Nutrition data | USDA-style dataset plus a locally supplemented regional dataset |
| Hosting / CDN | Vercel |

## 🏗️ Architecture Overview

- **Client (browser):** runs all application logic, including parsing, matching, nutrition calculation, and risk evaluation.
- **Vercel:** serves the compiled static bundle only.
- **Firebase:** handles user authentication and data persistence through SDK calls.
- **Gemini (Google AI Studio):** called over REST for defined classification and narrative tasks only.

Risk flagging uses threshold-based comparison, independent of the classifier, so classifier uncertainty never affects condition-specific warnings.

## 📊 Classifier Performance

One-vs-rest ROC analysis (AUC):

| Class | AUC |
|---|---|
| Healthy | 97.21% |
| Moderate | 90.89% |
| Unhealthy | 97.33% |

## 🚀 Getting Started

```bash
# Clone the repository
git clone YOUR_REPO_LINK_HERE
cd nutrisense

# Install dependencies
npm install

# Add your Firebase and Gemini keys to a .env file
# Start the development server
npm start
```

## 🔮 Future Work

- Expand automated test coverage
- Broaden condition and meal template coverage
- Validate substitution effectiveness with user-reported outcomes
- Evolve into a food ordering platform with vendor and restaurant integration (this would require a custom backend)

## 👩‍💻 Authors

- Arpita Nath
- Khushnud Durdana

Department of Computer Science, Asian University for Women (AUW), Chattogram, Bangladesh

## 📄 Reference

Nath, A. & Durdana, K. *NutriSense: A Cloud-Based AI-Driven System for Recipe Analysis & Nutritious Meal Planner.*
