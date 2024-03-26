import React, { useState, useRef } from "react";
import ReactMapGL, { Marker, Popup } from "react-map-gl";
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
    { name: "Site_Details_Fields", type:"column", source:"source", allowMultiple:true }, //for creating site-level popup information in the future. I was unable to figure this out.
  ]);

export default function App() {

  const config = useConfig();
  const columns = useElementColumns(config.source);
  const sigmaData = useElementData(config.source);

  
  const data = React.useMemo(() => {
    const latitude = config.Latitude;
    const longitude = config.Longitude;
    const subpopulation = config.Subpopulation;
    //const pup_fields = config.Site_Details_Fields
    // console.log('got data', config, sigmaData, columns, latitude, longitude, fields);
    const _data = [];
    if (sigmaData?.[latitude] && sigmaData?.[longitude]) {
        for (let i = 0; i < sigmaData[latitude].length; i++) {
          const lat = sigmaData[latitude][i];
          const long = sigmaData[longitude][i];
          const spop = sigmaData[subpopulation][i];
          //const popup_fields = pup_fields.map(id => {
          //  return {
          //    key: columns[id]?.name || '',
          //    value: sigmaData[id] ? sigmaData[id][i] : '',
          //  };
          //}); 
          _data.push({
            id: i,
            coordinates: [long, lat],
            subpop: spop
            //popup_fields: popup_fields
          })
        }
    }
    return _data
  }, 
  [columns, config.Latitude, config.Longitude, config.Subpopulation, config.SiteDetailsFields, sigmaData]);

  //TODO: make the sizing below dynamic
  const [viewport, setViewport] = useState({
    latitude: 34.0549,
    longitude: -118.2426,
    width: "100vw",
    height: "100vh",
    zoom: 8
  });

  // state
  const [showPopup, setShowPopup] = useState(null);
  
  const mapRef = useRef();

  const sites = data ? data : [];

  const points = sites.map(site => ({
    type: "Feature",
    properties: { 
        cluster: false,
        subpop: site.subpop,
        //popup_fields: site.popup_fields
    },
    geometry: {
      type: "Point",
      coordinates: site.coordinates,
    },
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
    options: { 
        radius: 75, 
        maxZoom: 14, 
        //use map/reduce functionality to compute
        //the number of targeted customers in each cluster
        map: props => ({
            target_count: props.subpop ? 1 : 0,
            }),
        reduce: (acc,props) => {
            acc.target_count += props.target_count;
            }
    }
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
        {//Add icons for each cluster.
         clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const subpop = cluster.properties.subpop;
          const {
            cluster: isCluster,
            point_count: pointCount,
          } = cluster.properties;

          //Scale the diameter as the 1/5th power of the number of
          //points in the cluster, with a minimum size of 20px. 
          //This is a weird scaling, but it ensures that the
          //icon sizes for huge clusters don't get ridiculous, while
          //also making sure clusters of size 2 are visible. 
          const diameter = 20*(pointCount/2)**(1/5)


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
                    width: `${diameter}px`,
                    height: `${diameter}px`,
                    marginLeft: `-${diameter/2}px`,
                    marginTop: `-${diameter/2}px`
                  }}
                >
                    {pointCount}    
                </div>
                
             </Marker>

            );
          }

          return (

            //Add icons for individual sites
            <Marker
              latitude={latitude}
              longitude={longitude}
              onClick={()=>setShowPopup(cluster)}
            >
             <div
                className={subpop ? "target-site-marker" : "site-marker"}
                style={{
                  width:`${7}px`, 
                  height:`${7}px`
                }}
              >
              {}
            </div>
            </Marker>

          );
        })};

   
    {//Add icons for the targeted population
    clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const {
            cluster: isCluster,
            point_count: pointCount,
            target_count: targetCount
          } = cluster.properties;
          
          //scale the targeted-population icon so that the area is proportional to the
          //fraction of the total cluster that has been targeted
          const diameter = 20*(pointCount/2)**(1/5)*(targetCount/pointCount)**(1/2)
          if (isCluster) {
            return (
                <div key={`cluster-${cluster.id}`}>
              <Marker
                latitude={latitude}
                longitude={longitude}
                onClick={()=>setShowPopup(cluster)}
              >
                <div
                  className="target-cluster-marker"
                  style={{
                    width: diameter ? `${diameter}px` : 0,
                    height: diameter? `${diameter}px` : 0,
                    marginLeft: `-${diameter/2}px`,
                    marginTop: `-${diameter/2}px`
                  }}

                >
                    {pointCount}    
                </div>           
              </Marker> 
              {showPopup && showPopup.id === cluster.id && (
                <Popup
                key={`cluster-${cluster.id}`}
                latitude={latitude}
                longitude={longitude}
                anchor = "bottom"
                onClose={() => setShowPopup(null)}
                closeButton={true}
                closeOnClick={true}
                offsetLeft={0}
                >
                <span style={{fontSize: "1.2vw", fontFamily: "Poppins"}}>
                    <div>{pointCount} Sites</div>
                    <div>{targetCount} Targeted</div>
                </span>
                </Popup>
               )}
            </div>
            );
          }
        })}
      </ReactMapGL>
    </div>
  );
}
