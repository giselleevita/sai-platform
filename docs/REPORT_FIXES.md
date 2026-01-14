# Report and Export Fixes

## Issues Fixed

### 1. ✅ CSV Export Fixed
**Problem**: CSV export wasn't working properly.

**Solution**:
- Updated frontend to use proper `fetch` with authentication headers
- Added proper error handling
- CSV download now works with authentication token
- File downloads with proper filename: `ai-inventory-YYYY-MM-DD.csv`

**Files Changed**:
- `apps/web/app/reports/page.tsx` - Fixed `handleExportInventory` function

### 2. ✅ Report Generation Endpoints Fixed
**Problem**: Risk assessment and compliance report generation weren't working.

**Solution**:
- Enhanced error handling in report controllers
- Added better error messages for debugging
- Reports now properly return JSON data
- Frontend properly handles errors and shows user-friendly messages

**Files Changed**:
- `apps/api/src/controllers/report.controller.ts` - Enhanced error handling
- `apps/web/app/reports/page.tsx` - Better error messages

### 3. ✅ Risk Score Calculation Explanation Added
**Problem**: Users didn't know how risk scores were calculated.

**Solution**:
- Added comprehensive risk score calculation explanation on tool detail page
- Added tooltip on inventory page showing calculation formula
- Explanation includes:
  - Data Type Risk breakdown (PII=30, Financial=25, IP=20, etc.)
  - User Count Risk formula: (Users / 100) × 20 (max 20)
  - Frequency Risk (Daily=10, Weekly=5, Rarely=2)
  - Control Mitigation (-2 points per control)
  - Risk Level thresholds (Critical >75, High 50-75, Medium 25-50, Low <25)

**Files Changed**:
- `apps/web/app/inventory/[id]/page.tsx` - Added detailed risk calculation section
- `apps/web/app/inventory/page.tsx` - Added tooltip with calculation info

## How to Test

1. **CSV Export**:
   - Go to `/reports`
   - Click "Export CSV" button
   - Should download `ai-inventory-YYYY-MM-DD.csv` file

2. **Risk Assessment Report**:
   - Go to `/reports`
   - Click "Generate Report" on Risk Assessment card
   - Should download `risk-assessment-YYYY-MM-DD.json` file
   - File contains: summary stats, all tools with risk scores, all risks with decisions

3. **Compliance Report**:
   - Go to `/reports`
   - Click "Generate Report" on Compliance card
   - Should download `compliance-report-YYYY-MM-DD.json` file
   - File contains: compliance by framework, policy compliance, tool compliance

4. **Risk Score Calculation**:
   - Go to `/inventory` - hover over ⓘ next to "Risk Score" to see tooltip
   - Go to any tool detail page (`/inventory/[id]`) - see full calculation explanation

## Risk Score Formula

```
Total Risk Score = Data Type Risk + User Count Risk + Frequency Risk + Control Mitigation

Where:
- Data Type Risk = Average of data type values (PII=30, Financial=25, IP=20, Proprietary=15, Public=5)
- User Count Risk = min((Users / 100) × 20, 20)
- Frequency Risk = Daily: 10, Weekly: 5, Rarely: 2
- Control Mitigation = -2 × number of controls

Risk Levels:
- Critical: >75
- High: 50-75
- Medium: 25-50
- Low: <25
```

## API Endpoints

- `GET /api/inventory/export/csv` - Export inventory as CSV (requires TOOL_EXPORT permission)
- `GET /api/reports/risk-assessment` - Generate risk assessment report (requires REPORT_READ permission)
- `GET /api/reports/compliance` - Generate compliance report (requires REPORT_READ permission)

## Permissions Required

- **CSV Export**: `TOOL_EXPORT` (OPERATOR, ADMIN, MANAGEMENT, AUDITOR roles)
- **Reports**: `REPORT_READ` (OPERATOR, ADMIN, MANAGEMENT, AUDITOR roles)
