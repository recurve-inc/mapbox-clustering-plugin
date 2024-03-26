# MapBox Clustering with Remote Data - Sigma plugin code

Forked by Brian Gerke from https://github.com/leighhalliday/mapbox-clustering with additional features pulled from the Sigma example plugin repo (https://github.com/sigmacomputing/plugin)


Necessary next steps to use in deployed dashboards:
* Modify the code to automatically center the initial view on the data (it is currently hard coded to center on Los Angeles)
* Run the app on a production server that we can access from Sigma dashboards
* Modify the Sigma plugin to point to the production server

Nice-to-haves:
* Make the colors configurable in Sigma (currently hard coded in CSS)
* Add a popup for individual sites that displays data from the Site_Details_Fields
* Let the max zoom level be configurable in Sigma

