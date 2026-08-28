# RǏWYÑ Profit Hub

# Build a RǏWYÑ Business Profit & Unit Economics Dashboard

Build a polished internal web app for my clothing brand **RǏWYÑ**.

This is NOT a customer-facing ecommerce website. It is an internal business dashboard/calculator that helps me track daily sales, advertising spend, product costs, shipping, fees, profit, and unit economics.

The app should feel modern, premium, minimal, fast, and extremely easy to use. Think of it as a combination of a **daily profit calculator + business dashboard + unit economics calculator**.

Use a clean modern UI with responsive desktop and mobile layouts.

---

# 1. CORE PURPOSE

I want to enter my daily business numbers once and have the application automatically calculate:

* Revenue

* Orders

* Sessions

* Conversion rate

* Average order value

* Ad spend

* Ad spend per order / CPA

* Product/COGS cost

* Printing cost

* Packaging cost

* Shipping cost

* Payment gateway fees

* COD fees

* RTO costs

* Total variable costs

* Gross profit

* Contribution profit

* Net profit

* Net profit per order

* Profit margin

* ROAS

* Break-even CPA

* Break-even ROAS

The app must save historical daily records so I can view:

* Today

* Yesterday

* Last 7 days

* Last 30 days

* Current month

* Custom date ranges

---

# 2. APP STRUCTURE

Create these main sections/pages:

1. Dashboard

2. Daily Entry

3. Profit Calculator

4. Products & Costs

5. Reports / History

6. Settings

Use a left sidebar on desktop and a suitable mobile navigation.

---

# 3. DASHBOARD

The Dashboard should immediately show the health of my business.

At the top include a date-range selector:

* Today

* Yesterday

* Last 7 Days

* Last 30 Days

* This Month

* Custom

Show large KPI cards:

### Revenue

Total realized/net sales for the selected period.

### Orders

Number of orders.

### Sessions

Total website sessions.

### Conversion Rate

Orders ÷ Sessions × 100

### AOV

Revenue ÷ Orders

### Ad Spend

Total advertising spend.

### CPA

Ad Spend ÷ Orders

### ROAS

Revenue ÷ Ad Spend

### Total Costs

All applicable costs.

### Net Profit

Revenue − Total Costs

### Profit / Order

Net Profit ÷ Orders

### Net Margin

Net Profit ÷ Revenue × 100

---

# 4. DASHBOARD CHARTS

Add clean charts for:

### Revenue over time

Daily revenue.

### Ad Spend over time

Daily ad spend.

### Orders over time

Daily orders.

### Net Profit over time

Daily net profit.

### Profit vs Ad Spend

Useful comparison chart.

Allow hovering over data points to show exact values.

---

# 5. DAILY ENTRY PAGE

This is one of the most important pages.

Make the form extremely easy to fill out.

At the top:

### Date

Default to today's date.

Then sections:

## SALES

Fields:

* Gross Sales

* Discounts

* Refunds

* Shipping charged to customers

* Number of Orders

* Delivered Orders

* Cancelled Orders

* RTO Orders

Calculate:

### Net Revenue

Gross Sales − Discounts − Refunds

If appropriate, separately show customer-paid shipping.

---

# 6. TRAFFIC & MARKETING

Fields:

* Sessions

* Meta Ad Spend

* Agency Ad Spend

* Influencer Spend

* Other Marketing Spend

Calculate:

### Total Marketing Spend

Meta + Agency + Influencer + Other

### CPA

Total Marketing Spend ÷ Orders

Also show Meta CPA separately when Meta spend is entered.

---

# 7. PRODUCT SALES

Allow me to select products and enter quantities sold.

Example:

RǏWYÑ Jeans

Quantity: 6

RǏWYÑ Tee

Quantity: 2

The app should automatically pull each product's configured:

* Selling price

* Product cost

* Printing cost

* Packaging cost

Calculate product-level COGS automatically.

For example:

Product cost × quantity

Printing cost × quantity

Packaging cost × quantity

Then total them.

---

# 8. COST LIBRARY

Create a Products & Costs section where I can create/edit products.

Each product should have:

* Product name

* SKU (optional)

* Selling price

* Product/manufacturing cost

* Printing cost

* Packaging cost

* Active/inactive status

Example products:

RǏWYÑ Jeans

RǏWYÑ Tee

But do NOT hardcode these products. They must be editable.

---

# 9. OTHER COST SETTINGS

Create configurable business costs:

### Shipping

* Prepaid shipping cost/order

* COD shipping cost/order

* RTO shipping cost/order

* Return shipping cost/order

### Payment

* Payment gateway percentage

* Fixed payment fee if applicable

* COD fee/order

### Packaging

Allow packaging to either be included in product-level costs or configured as a separate cost.

Make this behavior configurable so I don't accidentally double-count packaging.

### Other variable cost/order

Allow a general configurable amount.

---

# 10. COST CALCULATION ENGINE

This is extremely important.

Do not simply display numbers. Build a proper calculation engine.

The application should calculate:

### Product COGS

Sum of:

Product quantity × product manufacturing cost

### Printing Cost

Sum of:

Product quantity × printing cost

### Packaging Cost

Based on configured packaging logic.

### Shipping Cost

Calculate based on relevant order counts and shipping settings.

Where possible distinguish:

* Delivered orders

* COD orders

* RTO orders

### Payment Gateway Fees

Use the configured percentage against the appropriate revenue amount.

### COD Fees

COD orders × COD fee/order.

### RTO Costs

RTO orders × configured RTO cost.

---

# 11. PROFIT FORMULAS

Use clear and consistent formulas.

### Net Revenue

Gross Sales − Discounts − Refunds

### Total Marketing Spend

Meta Spend + Agency Spend + Influencer Spend + Other Marketing Spend

### Total Variable Costs

Product COGS

* Printing

* Packaging

* Shipping

* Payment Fees

* COD Fees

* RTO Costs

* Other Variable Costs

### Contribution Profit

Net Revenue − Product/fulfillment/transaction variable costs

### Net Profit

Net Revenue − Total Variable Costs − Marketing Spend − allocated fixed costs

If fixed costs are not entered, clearly show that net profit is calculated before fixed costs.

Do not silently mix fixed and variable costs.

---

# 12. PROFIT PER ORDER

Calculate:

### Net Profit / Order

Net Profit ÷ Orders

Also show:

### Contribution / Order

Contribution Profit ÷ Orders

### Marketing Cost / Order

Marketing Spend ÷ Orders

### COGS / Order

COGS ÷ Orders

---

# 13. UNIT ECONOMICS / BREAK-EVEN CALCULATOR

Create a dedicated Profit Calculator page.

This should allow me to enter hypothetical numbers without changing my saved daily records.

Inputs:

* Selling Price

* Product Cost

* Printing

* Packaging

* Shipping

* Payment Fee

* COD Fee

* Other Variable Cost

* Expected CPA

Then calculate:

### Contribution Before Ads

Selling Price − all non-ad variable costs

### Profit After Ads

Contribution Before Ads − CPA

### Break-even CPA

The maximum advertising cost per order before the order becomes unprofitable.

### Break-even ROAS

Selling Price ÷ contribution available for advertising

Show these numbers prominently.

Use clear indicators:

🟢 Profitable

🟡 Low margin

🔴 Losing money

---

# 14. "WHAT IF?" AD SCALING CALCULATOR

Add a scenario calculator.

Inputs:

* Daily Ad Budget

* Expected CPA

* Average Order Value

* Variable Cost / Order

Automatically calculate:

* Expected Orders

* Expected Revenue

* Expected Ad Spend

* Expected Variable Costs

* Expected Profit

* Expected Profit Margin

* Expected ROAS

Example:

Daily Ad Budget = ₹1,500

Expected CPA = ₹200

Expected Orders = 7.5

The calculator should handle decimals internally but display realistic order estimates appropriately.

Allow me to compare scenarios:

### ₹500/day

### ₹1,000/day

### ₹1,500/day

### ₹2,000/day

### ₹3,000/day

Show estimated results side by side.

---

# 15. PRODUCT PROFITABILITY

Create a product profitability table.

Columns:

* Product

* Units Sold

* Revenue

* Product Cost

* Printing

* Packaging

* Shipping

* Total Product Cost

* Contribution

* Contribution / Unit

Allow sorting by:

* Highest profit

* Highest units sold

* Highest revenue

* Best margin

---

# 16. REPORTS / HISTORY

Create a historical table with one row per day.

Columns:

Date

Sessions

Orders

Revenue

Ad Spend

CPA

ROAS

COGS

Shipping

Total Costs

Net Profit

Profit/Order

Margin

Allow:

* Search

* Date filtering

* Sorting

* Export CSV

Clicking a day should open the detailed daily record.

---

# 17. WEEKLY & MONTHLY REPORTS

Automatically aggregate daily records.

For any selected date range show:

* Total Revenue

* Total Orders

* Total Sessions

* Conversion Rate

* Total Ad Spend

* Average CPA

* Average AOV

* Total COGS

* Total Shipping

* Total Fees

* Total Costs

* Total Net Profit

* Profit/Order

* Net Margin

* ROAS

Also show comparison against the previous equivalent period.

Example:

Revenue

₹84,000

↑ 21.4%

Net Profit

₹22,400

↑ 35.2%

Orders

54

↑ 18.3%

---

# 18. FIXED COSTS

Add an optional fixed-cost section in Settings.

Examples:

* Shopify

* Apps

* Software

* Salaries

* Other monthly expenses

Allow monthly fixed costs to be entered.

For reporting, provide two numbers:

### Operating Profit Before Fixed Costs

and

### Net Profit After Fixed Costs

Do not force fixed costs into daily calculations unless configured.

---

# 19. DATA STORAGE

Use a real persistent database.

Create appropriate database tables for:

### products

* id

* name

* sku

* selling_price

* product_cost

* printing_cost

* packaging_cost

* active

* created_at

* updated_at

### daily_records

* id

* date

* gross_sales

* discounts

* refunds

* sessions

* orders

* delivered_orders

* cancelled_orders

* rto_orders

* meta_spend

* agency_spend

* influencer_spend

* other_marketing_spend

* notes

* created_at

* updated_at

### daily_product_sales

* id

* daily_record_id

* product_id

* quantity

### business_cost_settings

Store shipping, payment, COD, RTO and other cost assumptions.

### fixed_costs

Store monthly fixed expenses.

Make sure historical calculations remain reliable if I later change a product's cost. Ideally, when a daily record is saved, snapshot the relevant cost values used for that day's calculation so changing today's product cost does not rewrite historical profitability.

---

# 20. DATA VALIDATION

Prevent obvious mistakes.

Examples:

* Orders cannot be negative.

* Sessions cannot be negative.

* Spend cannot be negative.

* Product quantities cannot be negative.

* Warn if Orders > Sessions.

* Warn if Delivered Orders + Cancelled Orders + RTO Orders is greater than Orders.

* Warn if Revenue is entered but Orders = 0.

* Warn if Ad Spend is entered but Orders = 0.

Warnings should be helpful, not block legitimate data entry unless absolutely necessary.

---

# 21. CURRENCY

Use Indian Rupees throughout.

Display:

₹1,599

₹12,450

₹1,04,500

Use proper Indian number formatting.

---

# 22. IMPORTANT ACCOUNTING BEHAVIOR

Never hide the underlying calculations.

Every major number should have a small "View calculation" or tooltip explaining how it was calculated.

For example:

Net Profit

₹5,420

Clicking it can show:

Net Revenue ₹12,792

− Product Costs ₹4,200

− Shipping ₹1,040

− Payment Fees ₹250

− Marketing ₹1,500

= Net Profit ₹5,802

This makes the tool trustworthy and lets me catch mistakes.

---

# 23. DASHBOARD INSIGHTS

Add a small "Business Insights" area.

Automatically identify things such as:

* CPA increased compared with previous period.

* Conversion rate improved.

* Profit/order decreased.

* Ad spend increased but revenue did not increase proportionally.

* Best-selling product.

* Most profitable product.

* Highest-profit day.

* Lowest-profit day.

Keep these insights factual and based only on the stored numbers.

Do not make aggressive financial claims.

---

# 24. UI DESIGN

Make the UI feel like a premium founder/business dashboard.

Design principles:

* Clean

* Minimal

* Modern

* Fast

* No unnecessary animations

* Strong visual hierarchy

* Large readable KPI numbers

* Lots of whitespace

* Professional charts

* Responsive

* Easy to use on laptop and phone

Use a neutral premium palette rather than making everything bright.

Profit-positive and loss-negative states should be visually obvious.

---

# 25. DAILY WORKFLOW

Optimize the app for this exact workflow:

I open the app.

I click:

**Add Today's Numbers**

I enter:

Date

Sessions

Orders

Revenue

Ad Spend

Product quantities

RTO/cancelled orders

The app automatically calculates everything else.

Then I immediately see:

### TODAY

Revenue ₹X

Orders X

CPA ₹X

ROAS X

Total Costs ₹X

Net Profit ₹X

Profit / Order ₹X

I should be able to complete this process in under 60 seconds once my costs are configured.

---

# 26. SAMPLE DATA

Populate the application initially with clearly marked sample/demo data so I can see how the dashboard works.

Use fictional sample numbers and label them as demo data.

Do NOT pretend the demo data is my actual business data.

---

# 27. CRITICAL REQUIREMENT

The calculation logic is more important than visual polish.

Before finishing, test the formulas with several scenarios:

### Scenario 1

Revenue ₹10,000

Costs ₹6,000

Marketing ₹2,000

Net Profit should be ₹2,000.

### Scenario 2

Revenue ₹10,000

Costs ₹8,000

Marketing ₹3,000

Net Profit should be −₹1,000.

### Scenario 3

10 orders

₹2,000 ad spend

CPA should be ₹200.

### Scenario 4

100 sessions

5 orders

Conversion rate should be 5%.

### Scenario 5

₹1,500 revenue

₹500 total non-ad variable costs

₹200 CPA

Profit/order should be ₹800.

Test edge cases such as zero orders, zero sessions, refunds, cancelled orders and RTO orders.

---

# 28. FINAL PRODUCT REQUIREMENT

The finished application should be a genuinely usable internal RǏWYÑ business tool, not a static mockup.

I need:

* Working forms

* Persistent database

* Working calculations

* Historical records

* Editable product costs

* Editable business costs

* Working dashboard

* Working reports

* Working date filters

* Working charts

* Working CSV export

* Responsive UI

Build the application end-to-end.

Prioritize correctness, simplicity, and reliability.

Before considering the project complete, verify that all major calculations work correctly and that changing cost settings does not unexpectedly alter historical records.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://riwyn-pulse.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4f618b9c-20d7-409e-9182-4d97c34ddd33).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
