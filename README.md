# Worker Service Watcher

A AWS ECS Container Service that will poll a service endpoint and emit a AWS CloudWatch Metric based on the endpoint response.  

This service is used in conjunction with the https://github.com/Stockflare/lambda-service-watcher CloudFormation Custom Resource.  CloudFormations that use the lambda-service-watcher custom resource will trigger the creation of a DynamoDB table record containing details of the endpoint to monitor.

This service polls the DynamoDB table and for each record executes the poll.

## Polling
The polling mechanism is very simple:
* The service will perform a GET on the endpoint url.
* The service assume that the endpoint returns and array response
* The count of the array response is posted to a CloudWatch metric
* The URL and the CloudWatch metric name are supplied by the DynamoDB record
