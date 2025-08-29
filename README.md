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
- Makes API Call: Sends a POST request to the OpenAI API with the instructions and prompt using the gpt-4.1-mini model.
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

### Script Properties, Services, and Permissions
The system contains private properties that are stored within the Google Apps Script project:

1. `OPENAI_API_KEY`: The OpenAI API key is used to refer to our team project within OpenAI.
2. `SPREADSHEET_ID`: The Spreadsheet ID is used to refer to a specific Google Sheet spreadsheet saved in a Google account.

Instead of installing packages in a virtual environment, we add Services to our Google Apps Script project, which provide additional functionality that simplifies querying data and manipulating sheets. To properly query data from Google Analytics and post responses to Google Sheets, these services must be added to the project:

1. Analytics Data API v1: Provides methods to define Dimensions and Metrics and customize our website traffic reports with its `AnalyticsData.runReport` method.
2. Analytics Admin API v1: Provides a method to list the GA4 accounts and properties associated with the Google account.
3. Google Sheets API: Provides Visual Basic for Applications (VBA) functionality to modify cells, create sheets, and access spreadsheets.

Permissions are needed to query data from Google Analytics, send HTTP Requests to Open AI, and modify spreadsheets in Google Sheets. These are the Project OAuth Scopes needed to perform those actions:

1. View and manage your Google Analytics data (`https://www.googleapis.com/auth/analytics`): This scope is necessary to make the Analytics Data and Admin API calls for property and account data associated to your Google account.
2. Connect to an external service (`https://www.googleapis.com/auth/script.external_request`): This scope is necessary to make HTTP requests to third-party services like OpenAI for our summary reports.
3. See, edit, create, and delete all your Google Sheets spreadsheets (`https://www.googleapis.com/auth/spreadsheets`): The scope allows us to make the changes necessary to establish a header and modify cells within a spreadsheet.

### Looker Studio Connector
Looker Studio is a tool provided by Google that displays data from various sources into human-readable charts and tables. It allows reports to be interactive by establishing date range controls and data filters. Since we use Google Apps Script to generate summaries and store them in Google Sheets, we can establish a data source that is the spreadsheet related to the website.
