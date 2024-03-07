'use client'
import React, { useEffect, useState } from 'react';
import 'ol/ol.css'; 
import Map from 'ol/Map'; 
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile'; 
const KEY = process.env.API_KEY;


import { Vector as VectorLayer } from 'ol/layer'; 
import { XYZ } from 'ol/source'; 
import { Vector as VectorSource } from 'ol/source'; 
import Draw from 'ol/interaction/Draw'; 
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'; 
import { getArea, getLength } from 'ol/sphere'; 



const MapComponent: React.FC = () => {
  // Define states for the map, draw type, measurement, and pin coordinates
  const [map, setMap] = useState<Map | null>(null); // State for the map
  const [drawType, setDrawType] = useState<'Point' | 'LineString' | 'Polygon'>('Point'); // State for the type of drawing
  const [measurement, setMeasurement] = useState<{ value: number | null, unit: string }>({ value: null, unit: '' }); // State for the measurement
  const [pinCoordinates, setPinCoordinates] = useState<number[] | null>(null); // State for the pin coordinates

  // Effect hook to initialize the map
  useEffect(() => {
    // Create a new Map instance
    const initialMap = new Map({
      target: 'map', // DOM element where the map will be rendered
      layers: [
        new TileLayer({
          source: new XYZ({
            url: `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${KEY}`, // URL for Google Maps tiles
          }),
        }),
      ],
      view: new View({
        center: [0, 0], // Initial center of the map
        zoom: 2, // Initial zoom level of the map
      }),
    });

    // Set the map to the state
    setMap(initialMap);

    // Cleanup function to dispose the map when component unmounts
    return () => {
      if (initialMap) {
        initialMap.dispose();
      }
    };
  }, []); // Dependency array is empty, so this effect runs only once after the initial render

  // Effect hook to handle drawing interactions
  useEffect(() => {
    // If map is not available, return
    if (!map) return;

    // Create a vector source for drawing features
    const source = new VectorSource();

    // Create a vector layer to display drawn features
   
    const layer = new VectorLayer({
      source: source,
    });
    map.addLayer(layer); // Add the vector layer to the map

    // Create a Draw interaction based on the selected draw type
    const draw = new Draw({
      source: source, // Set the source for drawn features
      type: drawType, // Set the type of geometry to draw
      style: new Style({ // Set the style for drawn features
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)', // Fill color with opacity
        }),
        stroke: new Stroke({
          color: '#ffcc33', // Stroke color
          width: 2, // Stroke width
        }),
        image: new CircleStyle({
          radius: 7, // Circle radius
          fill: new Fill({
            color: '#424296', // Circle fill color
          }),
        }),
      }),
    });

    // Event listener for the 'drawend' event, triggered when drawing ends
    draw.on('drawend', (event) => {
      const feature = event.feature; // Get the drawn feature
      const geometry = feature.getGeometry(); // Get the geometry of the feature

      let newMeasurement: { value: number | null, unit: string };

      // Calculate measurement based on draw type
      if (drawType === 'Polygon') {
        const area = getArea(geometry); // Calculate area for polygons
        newMeasurement = { value: area, unit: 'square meters' };
      } else if (drawType === 'LineString') {
        const length = getLength(geometry); // Calculate length for linestrings
        newMeasurement = { value: length, unit: 'meters' };
      } else {
        newMeasurement = { value: null, unit: '' }; // No measurement for points
      }

      // Update measurement state with the calculated value and unit
      setMeasurement(newMeasurement);
    });

    // Add the draw interaction to the map
    map.addInteraction(draw);

    // Cleanup function to remove draw interaction and vector layer when component unmounts
    return () => {
      map.removeInteraction(draw);
      map.removeLayer(layer);
    };
  }, [drawType, map]); // Dependency array includes drawType and map, so this effect runs whenever drawType or map changes

  // Effect hook to handle click events on the map
  useEffect(() => {
    // If map is not available, return
    if (!map) return;

    // Click handler function
    const clickHandler = (evt: any) => {
      const coordinates = evt.coordinate; // Get the clicked coordinates
      setPinCoordinates(coordinates); // Set the pin coordinates state
    };

    // Add click event listener to the map
    map.on('click', clickHandler);

    // Cleanup function to remove click event listener when component unmounts
    return () => {
      map.un('click', clickHandler);
    };
  }, [map]); // Dependency array includes map, so this effect runs whenever map changes

  // Function to handle changes in draw type
  const handleDrawTypeChange = (type: 'Point' | 'LineString' | 'Polygon') => {
    setDrawType(type); // Set the draw type state
    setMeasurement({ value: null, unit: '' }); // Reset measurement state when draw type changes
  };

  // Render the component
  return (
    <div className='w-full flex flex-col items-center justify-center gap-6'>
      <div id="map" className='w-full h-[400px]'></div> {/* Map container */}
      <div className='w-[60%] flex flex-row justify-between gap-4 text-nowrap' >
        {/* Buttons to select draw type */}
        <button className='w-[20%] bg-slate-600 text-black' onClick={() => handleDrawTypeChange('Point')}>Draw Point</button>
        <button className='w-[20%] bg-slate-600 text-black' onClick={() => handleDrawTypeChange('LineString')}>Draw Line</button>
        <button className='w-[20%] bg-slate-600 text-black' onClick={() => handleDrawTypeChange('Polygon')}>Draw Polygon</button>
      </div>
      {/* Display pin coordinates when draw type is 'Point' */}
      {pinCoordinates && drawType === 'Point' ? (
        <div>
          Coordinates: {pinCoordinates.map(coord => coord.toFixed(2)).join(', ')}
        </div>
      ) : <></>}
      {/* Display measurement */}
      {measurement.value !== null && (
        <div>
          Measurement: {measurement.value.toFixed(2)} {measurement.unit}
        </div>
      )}
    </div>
  );
};

export default MapComponent; 
