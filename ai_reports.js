const spreadsheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));

// Calls OpenAI by making HTTP request, generates a summary with the previous and current month's data
function callOpenAIAPI(property_name, curr_site_stats, prev_site_stats, reports) {
  const OPENAI_API_KEY = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  const model = 'gpt-4.1-mini';
  const max_tokens = 2500;
  // const model = 'gpt-5-nano';

  const instructions = "Identity: You are an assistant that helps summarize website traffic reports and provides insights on how to improve a website based on the report given. Note that the main audience for these websites are for college students at Yale. Instructions: When responding, focus on summarizing the provided website traffic report clearly and concisely with statistics. Provide actionable insights on how the website can improve traffic and engagement. Focus on high-level executive commentary in 300 words or less."

  const prompt = property_name + "is the website we are analyzing. Given this month's general stats:\n" + curr_site_stats + "\nits popular pages:\n" + reports[0] + "\nits sessions throughout the month:\n" + reports[1] + "\nits sessions throughout the week:\n" + reports[2] + "\nits sessions throughout the day:\n" + reports[3] + "\nWhat can you tell me about the website's performance? How does the report compare to last month's data? Last month's stats:\n" + prev_site_stats + "\nLast month's popular pages:\n" + reports[4] + "\nLast month's sessions throughout the month:\n" + reports[5] + "\nLast month's sessions throughout the week:\n" + reports[6] + "\nLast month's sessions throughout the day:\n" + reports[7];

  const headers = {
    'Authorization': 'Bearer ' + OPENAI_API_KEY,
    'Content-Type': 'application/json'
  };

  const payload = JSON.stringify({
    model: model,
    messages: [{ role: 'user', content: instructions + '\n' + prompt }],
    max_tokens: max_tokens
  });

  const options = {
    method: 'post',
    headers: headers,
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  const responseText = response.getContentText();
  const jsonResponse = JSON.parse(responseText);

  //NOTE: Checking if API worked, if it worked, message can be found with jsonResponse.choices[0].message
  console.log(property_name, jsonResponse);

  return jsonResponse.choices[0].message.content;
}
 
// Formats the given date (e.g. August 1, 2025) to YYYY-MM-DD format (e.g. 2025-08-01)
function formatDate(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var day = ('0' + date.getDate()).slice(-2);
  
  return year + '-' + month + '-' + day;
}

// Gets current month's and last month's start date and end date
function getDates() {
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();

  var currentMonthStartDate = new Date(year, month, 1);
  var currentMonthEndDate = new Date(year, month + 1, 0);

  var lastMonthStartDate = new Date(year, month - 1, 1);
  var lastMonthEndDate = new Date(year, month, 0);

  currentMonthStartDate = formatDate(currentMonthStartDate);
  currentMonthEndDate = formatDate(currentMonthEndDate);

  lastMonthStartDate = formatDate(lastMonthStartDate);
  lastMonthEndDate = formatDate(lastMonthEndDate);

  return [
    currentMonthStartDate,
    currentMonthEndDate,
    lastMonthStartDate,
    lastMonthEndDate
  ];
}

function runReport(property, displayName) {

  try {
    const page_views_metric = AnalyticsData.newMetric();
    page_views_metric.name = 'screenPageViews';

    const total_users_metric = AnalyticsData.newMetric();
    total_users_metric.name = 'activeUsers';

    const sessions_metric = AnalyticsData.newMetric();
    sessions_metric.name = 'sessions';

    const avg_sessions_duration_metric = AnalyticsData.newMetric();
    avg_sessions_duration_metric.name = "averageSessionDuration";

    const bounce_rate_metric = AnalyticsData.newMetric();
    bounce_rate_metric.name = 'bounceRate';

    const page_views_per_user_metric = AnalyticsData.newMetric();
    page_views_per_user_metric.name = 'screenPageViewsPerUser';

    const engaged_sessions_metric = AnalyticsData.newMetric();
    engaged_sessions_metric.name = 'engagedSessions';

    const page_dimension = AnalyticsData.newDimension();
    page_dimension.name = 'pageTitle';

    const date_dimension = AnalyticsData.newDimension();
    date_dimension.name = 'date';

    const day_of_week_dimension = AnalyticsData.newDimension();
    day_of_week_dimension.name = 'dayOfWeekName';

    const hour_dimension = AnalyticsData.newDimension();
    hour_dimension.name = 'hour';

    const dateRange = AnalyticsData.newDateRange();
    const ob = AnalyticsData.newOrderBy();
    ob.metric = AnalyticsData.newMetricOrderBy();
    const request = AnalyticsData.newRunReportRequest();
    
    var website_stats = [];
    var reports = [];
    
    for (let i = 0; i <= 2;){
      request.dimensions = [];

      request.metrics = [
        total_users_metric,
        sessions_metric,
        bounce_rate_metric,
        page_views_per_user_metric,
        page_views_metric,
        avg_sessions_duration_metric,
      ];

      dateRange.startDate = getDates()[i];
      dateRange.endDate = getDates()[i+1];

      request.dateRanges = dateRange;

      var report = AnalyticsData.Properties.runReport(request, property);

      if (!report.rows) {
        console.log('No rows returned for', displayName);
        return;
      }

      var site_stats = "";

      for (let j = 0; j < report.metricHeaders.length; j++){
        site_stats += report.metricHeaders[j].name + ' ' + report.rows[0].metricValues[j].value + '\n';
      }

      website_stats.push(site_stats);
      i += 2;
    }

    for (let i = 0; i <= 2;){
      var popular_pages = 'pageTitle pageViews\n';
      var session_trends = 'date sessions\n';
      var most_active_days = 'dayOfWeekName sessions\n';
      var most_active_time = 'hour sessions\n';

      // Popular Pages with Page Title and Page Views
      request.dimensions = [page_dimension];
      request.metrics = [page_views_metric];

      dateRange.startDate = getDates()[i];
      dateRange.endDate = getDates()[i+1];

      ob.metric.metricName = page_views_metric.name;
      ob.desc = true;
      request.orderBys = [ob];
      request.limit = 10;

      request.dateRanges = dateRange;

      report = AnalyticsData.Properties.runReport(request, property);

      if (!report.rows) {
        console.log('No rows returned for', displayName);
        return;
      }

      for (let j = 0; j < report.rows.length; j++){
        for (let k = 0; k < report.dimensionHeaders.length; k++){
          popular_pages += report.rows[j].dimensionValues[k].value + ' ' + report.rows[j].metricValues[k].value + '\n';
        }
      }

      reports.push(popular_pages);

      request.limit = 100000;
      ob.metric.metricName = '';
      request.orderBys=[];

      // Session Trends with Date and Sessions
      request.dimensions = [date_dimension];
      request.metrics = [sessions_metric];

      report = AnalyticsData.Properties.runReport(request, property);

      if (!report.rows) {
        console.log('No rows returned for', displayName);
        return;
      }

      for (let j = 0; j < report.rows.length; j++){
        for (let k = 0; k < report.dimensionHeaders.length; k++){
          session_trends += report.rows[j].dimensionValues[k].value + ' ' + report.rows[j].metricValues[k].value + '\n';
        }
      }

      reports.push(session_trends);

      // Most Active Days with Day of Week and Sessions
      request.dimensions = [day_of_week_dimension];
      // request.metrics = [sessions_metric];

      report = AnalyticsData.Properties.runReport(request, property);

      if (!report.rows) {
        console.log('No rows returned for', displayName);
        return;
      }

      for (let j = 0; j < report.rows.length; j++){
        for (let k = 0; k < report.dimensionHeaders.length; k++){
          most_active_days += report.rows[j].dimensionValues[k].value + ' ' + report.rows[j].metricValues[k].value + '\n';
        }
      }

      reports.push(most_active_days);

      // Most Active Time with Hour and Sessions
      request.dimensions = [hour_dimension];
      // request.metrics = [sessions_metric];

      ob.metric.metricName = sessions_metric.name;
      ob.desc = true;
      request.orderBys = [ob];
      request.limit = 12;

      report = AnalyticsData.Properties.runReport(request, property);

      if (!report.rows) {
        console.log('No rows returned for', displayName);
        return;
      }

      for (let j = 0; j < report.rows.length; j++){
        for (let k = 0; k < report.dimensionHeaders.length; k++){
          most_active_time += report.rows[j].dimensionValues[k].value + ' ' + report.rows[j].metricValues[k].value + '\n';
        }
      }

      reports.push(most_active_time);

      request.limit = 1000;
      ob.metric.metricName = '';
      request.orderBys=[];

      i += 2;
    }
    
    //NOTE: This is for checking the output from queries of runReport()
    // for (let i = 0; i < reports.length; i++) { console.log(reports[i]); }

    // console.log("entering API call")
    const summary = callOpenAIAPI(displayName, website_stats[0], website_stats[1], reports);
    // console.log("leaving API call")

    //NOTE: This is for checking the output summary from API call to OpenAI
    // console.log(summary);

    try {
      var sheet = spreadsheet.insertSheet(displayName);
      sheet = spreadsheet.getSheetByName(displayName);
    } catch {
      sheet = spreadsheet.getSheetByName(displayName);
    }

    var cell = sheet.getRange("A2");
    cell.setValue(summary);

    cell = sheet.getRange("A1");
    cell.setValue("summary");

  } catch (e) {
    console.log('Failed with error: %s', e);
  }
}

function main() {
  
  const accounts = AnalyticsAdmin.AccountSummaries.list().accountSummaries;

  var list_properties = [];

  for (let i = 0; i < accounts.length; i++){ for (let j = 0; j < accounts[i].propertySummaries.length; j++){ list_properties.push(accounts[i].propertySummaries[j]); }  }

  for (let i = 0; i < list_properties.length; i++) { runReport(list_properties[i].property, list_properties[i].displayName); } 

  // Displays the location of the reports, stored in a spreadsheet identified by the ID in the project’s Script Properties.
  console.log('Report spreadsheet can be seen here: %s', spreadsheet.getUrl());

  return;
}
