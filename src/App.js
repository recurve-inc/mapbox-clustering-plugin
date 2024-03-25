import React, { useState, useRef } from "react";
//import useSwr from "swr";
import ReactMapGL, { Marker, FlyToInterpolator } from "react-map-gl";
import useSupercluster from "use-supercluster";
import {
    client,
    useConfig,
    //useElementColumns,
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
  //const columns = useElementColumns(config.source);
  const sigmaData = useElementData(config.source);
  
  const data = React.useMemo(() => {
    const latitude = config.Latitude;
    const longitude = config.Longitude;
    const subpopulation = config.Subpopulation;
    // console.log('got data', config, sigmaData, columns, latitude, longitude, fields);
    const _data = [];
    if (sigmaData?.[latitude] && sigmaData?.[longitude]) {
        for (let i = 0; i < sigmaData[latitude].length; i++) {
          const lat = sigmaData[latitude][i];
          const long = sigmaData[longitude][i];
          const spop = sigmaData[subpopulation][i];
          //const tooltips = fields.map(id => {
          //  return {
          //    key: columns[id]?.name || '',
          //    value: sigmaData[id] ? sigmaData[id][i] : '',
          //  };
          //}); 
          _data.push({
            id: i,
            coordinates: [long, lat],
            subpop: spop
          })
        }
    }
    return _data
  }, 
  [config.Latitude, config.Longitude, config.Subpopulation, sigmaData]);

  //TODO: make the sizing below dynamic
  const [viewport, setViewport] = useState({
    latitude: 34.0549,
    longitude: -118.2426,
    width: "100vw",
    height: "100vh",
    zoom: 8
  });
  const mapRef = useRef();

  const sites = data ? data : [];

  const points = sites.map(site => ({
    type: "Feature",
    properties: { cluster: false},
    geometry: {
      type: "Point",
      coordinates: site.coordinates,
    },
    subpop: site.subpop
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
    options: { radius: 75, maxZoom: 14 }
  });

  return (
    <div>
      <ReactMapGL
        {...viewport}
        maxZoom={18}
        mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        onViewportChange={newViewport => {
          setViewport({ ...newViewport });
        }}
        ref={mapRef}
      >
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const subpop = cluster.subpop
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
              >
                <div
                  className="cluster-marker"
                  style={{
                    width: `${20 + Math.sqrt(pointCount) / Math.sqrt(points.length) * 100}px`,
                    height: `${20 + Math.sqrt(pointCount) / Math.sqrt(points.length) * 100}px`
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
            //add some random jitter so colocated meters can be distinguished
            //not great, because it regenerates the number on each render, so
            //the points move around. 
            //TBD: use a different random number generator that can be 
            //given a seed.
              latitude={latitude + (Math.random()-0.5)*0.00005}
              longitude={longitude + (Math.random()-0.5)*0.00005}
            >
             <div
                className={subpop ? "target-site-marker" : "site-marker"}
                style={{
                  width:`${7}px`, 
                  height:`${7}px`
                }}
              >
              {//<button className="crime-marker">
                //<img src="/custody.svg" alt="crime doesn't pay" />
              //</button>
            }
            </div>
            </Marker>
          );
        })}
      </ReactMapGL>
    </div>
  );
}
