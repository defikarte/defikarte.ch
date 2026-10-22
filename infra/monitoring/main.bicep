// Monitoring and alerting for defikarte-backend: availability tests on /api/health, alert rules,
// action groups and saved log queries. Deploy into the resource group of the Application Insights instance.
// See README.md for the deploy command.

@description('Name of the existing Application Insights instance (same resource group).')
param appInsightsName string

@description('Region of the Application Insights instance.')
param location string = resourceGroup().location

@description('Backends to monitor. frequencySeconds must be 300 or 900.')
param environments array = [
  {
    name: 'production'
    healthUrl: 'https://defikarte-backend.azurewebsites.net/api/health'
    frequencySeconds: 300
  }
]

@description('Availability test locations. Keep at least 3, an alert needs 2 failing locations.')
param testLocations array = [
  'emea-ch-zrh-edge' // Switzerland North
  'emea-nl-ams-azr' // West Europe
  'emea-fr-pra-edge' // France Central
]

@description('Email addresses for warning and critical alerts.')
param alertEmails array

@description('Email addresses of Azure accounts signed in to the Azure mobile app (push for critical alerts).')
param pushEmails array

resource appInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: appInsightsName
}

var hiddenLink = 'hidden-link:${appInsights.id}'
var testNames = [for env in environments: 'defikarte health ${env.name}']

// ---------- Action groups ----------

resource warningGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-defikarte-warning'
  location: 'global'
  properties: {
    groupShortName: 'dk-warning'
    enabled: true
    emailReceivers: [
      for (email, i) in alertEmails: {
        name: 'email-${i}'
        emailAddress: email
        useCommonAlertSchema: true
      }
    ]
  }
}

resource criticalGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'ag-defikarte-critical'
  location: 'global'
  properties: {
    groupShortName: 'dk-critical'
    enabled: true
    emailReceivers: [
      for (email, i) in alertEmails: {
        name: 'email-${i}'
        emailAddress: email
        useCommonAlertSchema: true
      }
    ]
    azureAppPushReceivers: [
      for (email, i) in pushEmails: {
        name: 'push-${i}'
        emailAddress: email
      }
    ]
  }
}

// ---------- Availability tests: backend down, no data, stale data ----------

resource webTests 'Microsoft.Insights/webtests@2022-06-15' = [
  for (env, i) in environments: {
    name: 'defikarte-health-${env.name}'
    location: location
    tags: {
      '${hiddenLink}': 'Resource'
    }
    kind: 'standard'
    properties: {
      SyntheticMonitorId: 'defikarte-health-${env.name}'
      Name: testNames[i]
      Description: '/api/health returns 503 when the AED data is missing, too small or older than HEALTH_MAX_DATA_AGE_MINUTES.'
      Enabled: true
      Kind: 'standard'
      Frequency: env.frequencySeconds
      Timeout: 30
      RetryEnabled: true
      Locations: [for loc in testLocations: { Id: loc }]
      Request: {
        RequestUrl: env.healthUrl
        HttpVerb: 'GET'
        ParseDependentRequests: false
      }
      ValidationRules: {
        // Only the status code is checked: "degraded" (200) is reported by the email-only sync alert.
        ExpectedHttpStatusCode: 200
        SSLCheck: true
        SSLCertRemainingLifetimeCheck: 7
      }
    }
  }
]

resource availabilityAlerts 'Microsoft.Insights/metricAlerts@2018-03-01' = [
  for (env, i) in environments: {
    name: 'defikarte-${env.name}-unavailable'
    location: 'global'
    tags: {
      '${hiddenLink}': 'Resource'
      'hidden-link:${webTests[i].id}': 'Resource'
    }
    properties: {
      description: 'defikarte ${env.name}: backend down, no AED data or data too old (see /api/health).'
      severity: 1
      enabled: true
      scopes: [
        webTests[i].id
        appInsights.id
      ]
      evaluationFrequency: 'PT1M'
      windowSize: env.frequencySeconds <= 300 ? 'PT5M' : 'PT15M'
      criteria: {
        'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
        webTestId: webTests[i].id
        componentId: appInsights.id
        failedLocationCount: 2
      }
      autoMitigate: true
      actions: [
        { actionGroupId: criticalGroup.id }
      ]
    }
  }
]

// ---------- Log alerts (split by cloud_RoleName = slot) ----------

resource syncFailedAlert 'Microsoft.Insights/scheduledQueryRules@2023-12-01' = {
  name: 'defikarte-overpass-sync-failed'
  location: location
  properties: {
    displayName: 'defikarte: Overpass sync failed'
    description: 'SimpleCacheTimer could not update the AED cache. The old cache is still served. Fires after the first failed run.'
    severity: 3
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT15M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
union traces, exceptions
| where operation_Name == "SimpleCacheTimer"
| extend SyncResult = tostring(customDimensions.SyncResult)
| where SyncResult in ("rejected-too-few", "cache-write-failed", "error")
| project timestamp, cloud_RoleName, SyncResult
'''
          timeAggregation: 'Count'
          operator: 'GreaterThanOrEqual'
          threshold: 1
          dimensions: [
            { name: 'cloud_RoleName', operator: 'Include', values: ['*'] }
          ]
          failingPeriods: { numberOfEvaluationPeriods: 1, minFailingPeriodsToAlert: 1 }
        }
      ]
    }
    autoMitigate: true
    actions: { actionGroups: [warningGroup.id] }
  }
}

resource serverErrorsAlert 'Microsoft.Insights/scheduledQueryRules@2023-12-01' = {
  name: 'defikarte-server-errors'
  location: location
  properties: {
    displayName: 'defikarte: HTTP 5xx errors'
    description: 'At least 10 requests with status >= 500 within 15 minutes.'
    severity: 2
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT15M'
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
requests
| where toint(resultCode) >= 500
| project timestamp, cloud_RoleName, operation_Name
'''
          timeAggregation: 'Count'
          operator: 'GreaterThanOrEqual'
          threshold: 10
          dimensions: [
            { name: 'cloud_RoleName', operator: 'Include', values: ['*'] }
          ]
          failingPeriods: { numberOfEvaluationPeriods: 1, minFailingPeriodsToAlert: 1 }
        }
      ]
    }
    autoMitigate: true
    actions: { actionGroups: [warningGroup.id] }
  }
}

resource watchdogAlert 'Microsoft.Insights/scheduledQueryRules@2023-12-01' = {
  name: 'defikarte-availability-watchdog'
  location: location
  properties: {
    displayName: 'defikarte: availability test not running'
    description: 'No availability results within 1 hour. Without results, the availability alert cannot fire.'
    severity: 1
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT15M'
    windowSize: 'PT1H'
    criteria: {
      allOf: [
        {
          // Multi-line strings do not support interpolation, hence format().
          query: format('''
print name = dynamic({0})
| mv-expand name to typeof(string)
| join kind=leftouter (availabilityResults | summarize results = count() by name) on name
| where coalesce(results, 0) == 0
| project name
''', string(testNames))
          timeAggregation: 'Count'
          operator: 'GreaterThanOrEqual'
          threshold: 1
          dimensions: [
            { name: 'name', operator: 'Include', values: ['*'] }
          ]
          failingPeriods: { numberOfEvaluationPeriods: 1, minFailingPeriodsToAlert: 1 }
        }
      ]
    }
    autoMitigate: true
    actions: { actionGroups: [criticalGroup.id] }
  }
}

// ---------- Saved log queries (Logs > Queries > defikarte) ----------

var savedQueries = [
  {
    name: 'defikarte: requests'
    description: 'All requests, newest first. Filter by endpoint (name), status (resultCode) and slot (cloud_RoleName).'
    body: '''
requests
| where timestamp > ago(1h)
| project timestamp, cloud_RoleName, name, resultCode, duration, success, operation_Id
| order by timestamp desc
'''
  }
  {
    name: 'defikarte: requests by source'
    description: 'Requests per client (web / app-ios / app-android + version) and route.'
    body: '''
traces
| where timestamp > ago(1d) and message startswith "HTTP "
| extend Client = tostring(customDimensions.Client), Route = tostring(customDimensions.Route), StatusCode = toint(customDimensions.StatusCode)
| summarize requests = count(), errors = countif(StatusCode >= 500) by Client, Route, cloud_RoleName
| order by requests desc
'''
  }
  {
    name: 'defikarte: one request'
    description: 'Everything logged for one request. Replace the operation_Id.'
    body: '''
union traces, exceptions, requests, dependencies
| where operation_Id == "<operation_Id>"
| project timestamp, itemType, message, name, resultCode, severityLevel, customDimensions
| order by timestamp asc
'''
  }
  {
    name: 'defikarte: overpass sync history'
    description: 'Result of every SimpleCacheTimer run.'
    body: '''
union traces, exceptions
| where timestamp > ago(1d) and operation_Name == "SimpleCacheTimer"
| extend SyncResult = tostring(customDimensions.SyncResult), AedCount = toint(customDimensions.AedCount)
| project timestamp, cloud_RoleName, severityLevel, SyncResult, AedCount, message, outerMessage
| order by timestamp desc
'''
  }
  {
    name: 'defikarte: errors'
    description: 'Exceptions and error logs of the last 24 hours.'
    body: '''
union exceptions, (traces | where severityLevel >= 3)
| where timestamp > ago(1d)
| project timestamp, cloud_RoleName, operation_Name, itemType, message, outerMessage, operation_Id
| order by timestamp desc
'''
  }
  {
    name: 'defikarte: health checks'
    description: 'Availability test results per location.'
    body: '''
availabilityResults
| where timestamp > ago(1d)
| project timestamp, name, location, success, duration, message
| order by timestamp desc
'''
  }
]

resource queryPack 'Microsoft.OperationalInsights/queryPacks@2019-09-01' = {
  name: 'defikarte-queries'
  location: location
  properties: {}
}

resource queries 'Microsoft.OperationalInsights/queryPacks/queries@2019-09-01' = [
  for q in savedQueries: {
    parent: queryPack
    name: guid(queryPack.id, q.name)
    properties: {
      displayName: q.name
      description: q.description
      body: q.body
      related: {
        categories: ['applications']
        resourceTypes: ['microsoft.insights/components']
      }
      tags: {
        labels: ['defikarte']
      }
    }
  }
]
