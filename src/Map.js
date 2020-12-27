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
import { toLonLat } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import Feature from 'ol/Feature'

const MapToolTip = (center, text) => {
  return <div></div>;
};

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

    draw.on("drawend", async (e) => {
      let bbox = e.feature.getGeometry().getCoordinates();
      console.log(bbox);
      //let bbox = e.feature.getGeometry().getCoordinates()
      console.log(bbox[0].map((point) => toLonLat(point)));
      bbox = bbox[0].map((point) => toLonLat(point));
      console.log(bbox)
      // let response = await fetch (
      //     console.log(`https://rumap.ru/?measureArea=${bbox.join(";")}`)
      // )
      // console.log(response.json())
      let format = new GeoJSON({
        // dataProjection:"EPSG:4326"
      });
      // let gj = new GeoJSON({
      //   featureProjection: "EPSG:3857",
      //   geometryName:'Polygon'
      // })
      let geom = e.feature.getGeometry();
      geom.transform('EPSG:3857', 'EPSG:4326');
      var feature = new Feature({
        geometry: geom
      });
      
      let obj = format.writeFeatures([feature]);
      console.log(obj)
      // console.log(JSON.stringify(obj));

      // console.log(`http://gis01.rumap.ru/4898/areaStatistics?guid=93BC6341-B35E-4B34-9DFE-26796F64BBB7&geojson="${obj}"&spatialin=EPSG:3857`)

      let response = await fetch(
        `http://gis01.rumap.ru/4898/areaStatistics?guid=93BC6341-B35E-4B34-9DFE-26796F64BBB7&spatialin=EPSG:3857`,
        {
          method: "POST",
          // cors:"no-cors",
          body:obj
        }
      )

      let data = await response.json()
      console.log(data)
    });

    let modify = new Modify({
      source: source,
    });

    modify.on("modifyend", (e) => {
      console.log(e);
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
    initMap.addInteraction(modify);

    setMap(initMap);
  }, []);

  return (
    <div
      ref={mapElement}
      style={{ height: "100vh", width: "100hv" }}
      className="map-container"
    ></div>
  );
};
