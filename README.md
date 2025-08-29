# Automating GenAI Reports
Using information given from website traffic reports hosted on Google Analytics 4 (GA4), use Google Apps Script to query data and provide stakeholders with feedback and insights about their website traffic performance by using OpenAI API for GenAI responses and Google Sheets API to connect to Looker Studio and upload the generated summary.

## How it works
### The Functions
The system is built using Google Apps Script and consists of three primary functions:

1. `function runReport(property, displayName)`
- Takes Input: Accepts a GA4 property ID and the display name of the website.
- Queries GA4 Data: Fetches detailed website traffic metrics, including:
  - Most popular pages from the current and previous month (by page title and page views).
  - Session trends throughout the current and previous month (by date and session count).
  - Most active days of the week (based on session count).
  - Most active hours of the day (based on session count).
- Prepares Prompt: Formats this data to feed into the OpenAI model for summarization.
- Calls callOpenAIAPI: Sends the structured analytics data for AI-generated insights.
- Outputs to Google Sheets: Receives the response from OpenAI and pastes the summary into a designated Google Sheet, which is then connected to Looker Studio for dynamic reporting.

2. `function callOpenAIAPI(property_name, curr_site_stats, prev_site_stats, reports)`
- Takes Input: Accepts the display name of the GA4 property ID, the metrics from the current and previous month, and the reports queried in `runReport`.
- Creates Prompt: We structure a prompt comparing the previous month's and current month's traffic data to provide insightful feedback from the AI.
- Makes API Call: Sends a POST request to the OpenAI API with the instructions and prompt.
- Handles Response: Extracts and returns the AI-generated summary, including observations, insights, and potential recommendations based on website traffic trends.

3. `function main()`
- Takes Input: Does not accept input, as this is the function that will run first for the project.
- Queries GA4 Accounts: Fetches all accounts associated with the current Google account that are saved in GA4.
- Extracts GA4 Properties: Collects a list of properties saved under those GA4 accounts.
- Iterates `runReport` Call: Executes the `runReport` function for each GA4 property retrieved from the associated accounts.

The script also contains auxiliary functions that are used for `runReport`:

1. `function formatDate(date)`
- Takes Input: Accepts a date, which is formatted as the name of the month, day, and year (e.g. August 1, 2025).
- Output: Returns a string formatted as YYYY-MM-DD (e.g. 2025-08-01) for the DateRanges of `runReport`.

2. `function getDates()`
- Takes Input: Does not accept input.
- Calls formatDate: Pass the Date objects that represent the first and last days of the current and previous month to `formatDate`.
- Output: Returns a list of the first and last days for both the current and previous month.
