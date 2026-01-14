# PDF Reports Implementation

## ✅ Completed Features

### 1. PDF Generation
- **Library**: Puppeteer for HTML-to-PDF conversion
- **Templates**: Professional HTML templates with styling
- **Formats**: PDF (default) and JSON (backward compatible)

### 2. Report Types

#### Risk Assessment Report
- Executive summary with key metrics
- Risk trend analysis over time
- AI tools risk register
- Risk register with decisions
- Charts and graphs (when enabled)

#### Compliance Report
- Executive summary
- Compliance gap analysis
- Framework compliance (GDPR, NIS2, etc.)
- Policy compliance status
- Tool compliance status

#### Executive Summary
- Key metrics dashboard
- Risk overview
- Compliance status
- Recommendations

#### Custom Report Builder
- Select specific sections
- Include/exclude charts
- Date range filtering
- Custom filters

### 3. Charts and Graphs
- Risk trend charts (table format in PDF)
- Compliance metrics visualization
- Gap analysis visualization

### 4. Risk Trend Analysis
- Calculates average risk scores over time
- Groups by date
- Shows trend in risk levels

### 5. Compliance Gap Analysis
- Identifies missing DPAs
- Flags inactive policies
- Highlights missing evidence
- Provides recommendations
- Calculates overall compliance score

### 6. Scheduled Reports
- Cron-based scheduling
- Support for common schedules:
  - Daily (9 AM)
  - Weekly (Monday 9 AM)
  - Monthly (1st of month 9 AM)
- Email delivery (infrastructure ready)

## API Endpoints

### Generate Reports
- `GET /api/reports/risk-assessment?format=pdf&charts=true` - Risk assessment PDF
- `GET /api/reports/compliance?format=pdf&charts=true` - Compliance PDF
- `GET /api/reports/executive-summary?format=pdf&charts=true` - Executive summary PDF
- `POST /api/reports/custom?format=pdf` - Custom report PDF

### Scheduled Reports
- `GET /api/reports/scheduled` - List scheduled reports
- `POST /api/reports/scheduled` - Create scheduled report
- `DELETE /api/reports/scheduled/:id` - Delete scheduled report

## Frontend Features

### Reports Page (`/reports`)
- PDF/JSON format buttons for each report type
- Executive Summary report card
- Custom Report Builder modal
- Scheduled Reports section (to be added)

### Custom Report Builder
- Section selection (Risk Assessment, Compliance, Executive Summary)
- Include charts option
- Date range selection
- Generate PDF button

## Installation Notes

### Required Packages
```bash
# Backend
npm install puppeteer pdfkit chart.js node-cron canvas

# Frontend  
npm install recharts date-fns
```

### Puppeteer Setup
Puppeteer downloads Chromium automatically. If you encounter issues:
- On Linux: May need additional dependencies
- On macOS: Should work out of the box
- On Windows: May need Visual Studio Build Tools

Alternative: Use `pdfkit` for simpler PDFs without charts.

## Usage Examples

### Generate Risk Assessment PDF
```javascript
// Frontend
const response = await fetch('/api/reports/risk-assessment?format=pdf&charts=true', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
// Download blob as PDF
```

### Create Scheduled Report
```javascript
// Frontend
await api.post('/api/reports/scheduled', {
  name: 'Weekly Risk Report',
  type: 'risk-assessment',
  schedule: '0 9 * * 1', // Every Monday at 9 AM
  options: {
    type: 'risk-assessment',
    includeCharts: true,
  },
  recipients: ['admin@company.com'],
  enabled: true,
});
```

## Cron Schedule Examples

- `0 9 * * *` - Daily at 9 AM
- `0 9 * * 1` - Every Monday at 9 AM
- `0 9 1 * *` - First day of month at 9 AM
- `0 9 * * 1,3,5` - Monday, Wednesday, Friday at 9 AM

## Next Steps (Future Enhancements)

1. **Email Integration**: Send scheduled reports via email
2. **Database Storage**: Store scheduled reports in database
3. **Report History**: Track generated reports
4. **Advanced Charts**: Use Chart.js or similar for better visualizations
5. **Report Templates**: Allow custom HTML templates
6. **Multi-format Export**: Support Excel, Word formats
7. **Report Sharing**: Share reports via links
8. **Report Analytics**: Track report usage and popularity

## Troubleshooting

### Puppeteer Issues
If puppeteer fails to launch:
1. Check system dependencies
2. Try: `npm install puppeteer --force`
3. Consider using `pdfkit` as alternative

### PDF Generation Slow
- First generation may be slow (Chromium download)
- Subsequent generations should be faster
- Consider caching for frequently generated reports

### Charts Not Showing
- Charts are rendered as tables in PDF (Puppeteer limitation)
- For better charts, consider server-side chart generation with `canvas` or `chart.js-node-canvas`
