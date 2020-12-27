import React, { useState, useRef, useEffect } from "react";
import Map from "ol/Map";
import View from "ol/View";
import MultiPoint from "ol/geom/MultiPoint";
import TileLayer from "ol/layer/Tile";
import { Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { Draw, Modify, Snap } from "ol/interaction";
import Overlay from "ol/Overlay";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import { doubleClick } from "ol/events/condition";

export const MapComponent = () => {
  const mapElement = useRef();
  const toolTip = useRef();

  const [map, setMap] = useState();
  const [toolTipXY, setToolTipXY] = useState();
  const [toolTipText, setToolTipText] = useState();
  const [format, setFormat] = useState(new GeoJSON());
  // const [source, setSource] = useState(new VectorSource());

  const makeRequest = async (feature) => {
    setToolTipXY(feature.getGeometry().getInteriorPoint().getCoordinates());
    let geom = feature.getGeometry();
    let projected_geometry = geom.clone().transform("EPSG:3857", "EPSG:4326");
    let proj_feature = new Feature({
      geometry: projected_geometry,
    });
    let obj = format.writeFeatures([proj_feature]);
    let response = await fetch(
      `http://gis01.rumap.ru/4898/areaStatistics?guid=93BC6341-B35E-4B34-9DFE-26796F64BBB7`,
      {
        method: "POST",
        body: obj,
      }
    );

    let data = await response.json();
    setToolTipText(data["population_rs"]);
  };

  const clearPolygon = () => {
    // source.clear();
  };

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
          geometry: (feature) => {
            let coordinates = feature.getGeometry().getCoordinates()[0];
            return new MultiPoint(coordinates);
          },
        }),
      ],
    });

    let popup = new Overlay({
      id: "Measure",
      element: toolTip.current,
    });

    let draw = new Draw({
      source: source,
      type: "Polygon",
    });

    draw.on("drawstart", () => {
      //source.clear();
      setToolTipText("");
    });

    draw.on("drawend", (e) => {
      makeRequest(e.feature);
    });

    let modify = new Modify({
      deleteCondition: doubleClick,
      source: source,
    });

    modify.on("modifyend", (e) => {
      makeRequest(e.features.item(0));
    });

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
    initMap.addInteraction(modify);
    initMap.addOverlay(popup);

    setMap(initMap);
  }, []);

  useEffect(() => {
    if (!map) return
    let overlay = map.getOverlayById("Measure");
    overlay.setPosition(toolTipXY);
  }, [map, toolTipXY]);

  return (
    <div
      ref={mapElement}
      style={{ height: "100vh", width: "100hv" }}
      className="map-container"
    >
      <div ref={toolTip}>
            {toolTipText}
            <button onClick={clearPolygon}>х</button>
      </div>
    </div>
  );
};
