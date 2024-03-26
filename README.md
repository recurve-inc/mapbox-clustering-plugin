# MapBox Clustering with Remote Data - Sigma plugin code

Forked by Brian Gerke from https://github.com/leighhalliday/mapbox-clustering with additional features pulled from the Sigma example plugin repo (https://github.com/sigmacomputing/plugin)

To run the code locally it is necessary to create an `.env.local` file that looks like
```
REACT_APP_MAPBOX_TOKEN = xxxxxxx
``` 
with xxxxxx corresponding to a Mapbox.com API token.  In production, there should be some other `.env.*`
file (I am not familiar with the proper idiom here).

Necessary next steps to use in deployed dashboards:
* Modify the code to automatically center the initial view on the data (it is currently hard coded to center on Los Angeles)
* Obtain a Mapbox token that we can use in production (or switch to using Google Maps or similar)
* Run the app on a production server that we can access from Sigma dashboards
* Modify the Sigma plugin to point to the production server

Nice-to-haves:
* Change the background map to display in color instead of grayscale
* Allow showing satellite imagery on the map as an option
* Make the point colors configurable in Sigma (currently hard coded in CSS)
* Add a popup for individual sites that displays data from the Site_Details_Fields
* Let the max zoom level be configurable in Sigma

