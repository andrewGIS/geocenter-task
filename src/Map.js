import React, { useState, useRef, useEffect } from "react";

import Map from "ol/Map";
import View from "ol/View";
import MultiPoint from 'ol/geom/MultiPoint'
import TileLayer from "ol/layer/Tile";
import { Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { Draw, Snap } from "ol/interaction";

export const MapComponent = () => {
  const mapElement = useRef();

  const [map, setMap] = useState();

  useEffect(() => {
    let source = new VectorSource();
    let vector = new VectorLayer({
      source: source,
      style: [
        new Style({
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
          stroke: new Stroke({
            color: "#ffcc33",
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: "#ffcc33",
            }),
          }),
        }),
        new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: "#ffcc33",
            }),
          }),
          geometry: function (feature) {
            var coordinates = feature.getGeometry().getCoordinates()[0];
            return new MultiPoint(coordinates);
          },
        }),
      ],
    });

    let draw = new Draw({
      source: source,
      type: "Polygon",
    });

    let snap = new Snap({ source: source });

    const initMap = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vector,
      ],
      view: new View({
        zoom: 4,
        center: [0, 0],
      }),
    });

    initMap.addInteraction(draw);
    initMap.addInteraction(snap);

    setMap(initMap);
  }, []);

  const resetInteraction = () => {
    map.interactions = []
  }

  return (
    <div
      ref={mapElement}
      style={{ height: "100vh", width: "100hv" }}
      className="map-container"
    >
        <button onClick={resetInteraction}>Закончить рисование</button>
    </div>
    
  );
};
