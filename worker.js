console.log('Start');

var aws = require('aws-sdk');
var _ = require('underscore');
var moment = require('moment');
var http = require('http');
var url = require('url');

var region = process.env.AWS_REGION;
var table = process.env.DYNAMO_TABLE;


var dynamo = new aws.DynamoDB({ region: region });
var cloudwatch = new aws.CloudWatch({ region: region });

var jobs = {};


// Get all services watcher details from DynamoDB
var getAllDBJobs = function(fn) {
  result = dynamo.scan({
    TableName: table
  }, function(err, data){
    console.log('getAllDBJobs','err', 'data');
    var return_data = [];
    if (!_.isNull(data) && !_.isUndefined(data.Count) && data.Count > 0) {

      _.each(data.Items, function(item, index, items){
        console.log('Item');
        console.log(item.id, item.service_watcher, item.last_updated);
        var r = {};

        // Set up the item and create any defaults
        r.id = item.id.S;
        r.last_updated = item.last_updated.S;
        r.service_watcher = JSON.parse(item.service_watcher.S);
        return_data.push(r);
      }, this);

    } else {
      // console.log('COUNT FAILED')
      // console.log('err, data');
      // console.log(err, data);
    }
    fn(err, return_data);
  });
};

// Send the required metric
var executeJob = function(db_job) {
  console.log('Running Job:', db_job.id);
  path = url.parse(db_job.service_watcher.URL);
  var options = {
    host: path.host,
    path: path.path,
    port: path.port,
    protocol: path.protocol,
    method: 'GET'
  };
  var req = http.request(options, function(response){
    var result = '';
    response.on('data', function (chunk) {
      result += chunk;
    });

    response.on('end', function () {
      var count = 0;
      var result_object = JSON.parse(result);
      if (_.isArray(result_object)) {
        count = result_object.length;
      }
      console.log("Sending Metric Count: " , count);
      var params = {
        MetricData: [
          {
            MetricName: db_job.service_watcher.MetricName,
            Unit: 'Count',
            Value: count
          }
        ],
        Namespace: db_job.service_watcher.Namespace
      };
      cloudwatch.putMetricData(params, function(err, data){
        console.log(err);
        console.log(data);
      });
    });
  }).end();
};

// Check for service watchers every 10 seconds
setInterval(function() {
  console.log('Run all watc watchers');
  getAllDBJobs(function(err,data){
    _.each(data, function(job, index, all_jobs){
      executeJob(job);
    });
  });

}, 10000);

console.log("Interval is running");
