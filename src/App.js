import React, { useState, useRef } from "react";
//import useSwr from "swr";
import ReactMapGL, { Marker, FlyToInterpolator } from "react-map-gl";
import useSupercluster from "use-supercluster";
import {
    client,
    useConfig,
    useElementColumns,
    useElementData,
  } from "@sigmacomputing/plugin";
import "./App.css";

//const fetcher = (...args) => fetch(...args).then(response => response.json());

client.config.configureEditorPanel([
    { name: "source", type: "element" },
    { name: "Latitude", type: "column", source: "source", allowMultiple: false, allowedTypes: ['number', 'integer'] },
    { name: "Longitude", type: "column", source: "source", allowMultiple: false, allowedTypes: ['number', 'integer'] },
    { name: "Subpopulation", type: "column", source: "source", allowMultiple: false, allowedTypes: ['integer','boolean'] },
    { name: "Cluster scale", type: "text", placeholder: 'Number from 1 to 100' },
  ]);

export default function App() {

  const config = useConfig();
  const columns = useElementColumns(config.source);
  const sigmaData = useElementData(config.source);
  
  const data = React.useMemo(() => {
    const latitude = config.Latitude;
    const longitude = config.Longitude;
    const subpop = config.Subpopulation;
    // console.log('got data', config, sigmaData, columns, latitude, longitude, fields);
  }, 
  [columns, config.Latitude, config.Longitude, config.Subpopulation, sigmaData]);

  //TODO: make the sizing below dynamic
  const [viewport, setViewport] = useState({
    latitude: 34.0549,
    longitude: -118.2426,
    width: "100vw",
    height: "100vh",
    zoom: 8
  });
  const mapRef = useRef();

  //const url =
  //  "https://data.police.uk/api/crimes-street/all-crime?lat=52.629729&lng=-1.131592&date=2023-10";
  //const { data, error } = useSwr(url, { fetcher });
  const sites = data ? data.slice(0, 2000) : [];
  const points = sites.map(site => ({
    type: "Feature",
    properties: { cluster: false, subpop: site.subpop},
    geometry: {
      type: "Point",
      coordinates: [
        site.longitude,
        site.latitude
      ],
    }
  }));

  const bounds = mapRef.current
    ? mapRef.current
        .getMap()
        .getBounds()
        .toArray()
        .flat()
    : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: viewport.zoom,
    options: { radius: 75, maxZoom: 17 }
  });

  return (
    <div>
      <ReactMapGL
        {...viewport}
        maxZoom={50}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        onViewportChange={newViewport => {
          setViewport({ ...newViewport });
        }}
        ref={mapRef}
      >
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const subpop = cluster.properties.subpop
          const {
            cluster: isCluster,
            point_count: pointCount
          } = cluster.properties;

          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                latitude={latitude}
                longitude={longitude}
                subpop={subpop}
              >
                <div
                  className="cluster-marker"
                  style={{
                    width: `${10 + (pointCount / points.length) * 20}px`,
                    height: `${10 + (pointCount / points.length) * 20}px`
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      50
                    );

                    setViewport({
                      ...viewport,
                      latitude,
                      longitude,
                      zoom: expansionZoom,
                      transitionInterpolator: new FlyToInterpolator({
                        speed: 2
                      }),
                      transitionDuration: "auto"
                    });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          return (
            <Marker
              latitude={latitude}
              longitude={longitude}
              subpop={subpop}
              color={this.subpop ? 'green' : 'gray'}
            >
             <div
                  className="site-marker"
              ></div>
              {//<button className="crime-marker">
                //<img src="/custody.svg" alt="crime doesn't pay" />
              //</button>
            }
            </Marker>
          );
        })}
      </ReactMapGL>
    </div>
  );
}
