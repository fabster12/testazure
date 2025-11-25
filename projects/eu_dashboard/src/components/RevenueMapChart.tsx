
import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L, { Layer, LeafletMouseEvent } from 'leaflet';
import { scaleQuantile } from 'd3-scale';
import { interpolateRgb } from 'd3-interpolate';
import { useTheme } from '../contexts/ThemeContext';

interface RevenueMapChartProps {
  data: {
    name: string;
    revenue: number;
  }[];
}

const RevenueMapChart: React.FC<RevenueMapChartProps> = ({ data }) => {
    const { theme } = useTheme();
    const [geoJsonData, setGeoJsonData] = useState<any>(null);

    useEffect(() => {
        fetch('/data/europe.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                setGeoJsonData(data);
            })
            .catch(error => {
                console.error("Error fetching GeoJSON data:", error);
            });
    }, []);

    const dataByCountryName = useMemo(() => {
        return data.reduce((acc, item) => {
            const name = item.name === 'UK' ? 'United Kingdom' : item.name;
            acc[name] = item.revenue;
            return acc;
        }, {} as Record<string, number>);
    }, [data]);
    
    const colorScale = useMemo(() => {
        const revenues = data.map(d => d.revenue).filter(r => r > 0);
        const domain = revenues.length > 0 ? [0, ...revenues] : [0, 1];

        const lightColor = theme.name === 'Dark' ? '#374151' : '#E5E7EB'; // gray-700 or gray-200
        const darkColor = `rgb(${theme.colors.info})`;

        const colorInterpolator = interpolateRgb(lightColor, darkColor);
        const colorRange = [0, 0.2, 0.4, 0.6, 0.8].map(t => colorInterpolator(t));

        return scaleQuantile<string>()
            .domain(domain)
            .range(colorRange);

    }, [data, theme]);

    const style = (feature?: any) => {
        const revenue = dataByCountryName[feature.properties.name] || 0;
        return {
            fillColor: colorScale(revenue),
            weight: 1,
            opacity: 1,
            color: `rgb(${theme.colors.background})`,
            fillOpacity: 0.8
        };
    };

    const highlightFeature = (e: LeafletMouseEvent) => {
        const layer = e.target;
        layer.setStyle({
            weight: 2,
            color: `rgb(${theme.colors.accent})`,
            dashArray: '',
            fillOpacity: 0.9
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    };
    
    const resetHighlight = (e: LeafletMouseEvent) => {
        (e.target as any).setStyle(style(e.target.feature));
    };

    const onEachFeature = (feature: any, layer: Layer) => {
        const countryName = feature.properties.name;
        const revenue = dataByCountryName[countryName];
        const tooltipContent = `
            <strong style="color: rgb(${theme.colors['text-primary']});">${countryName}</strong>
            <br>
            <span style="color: rgb(${theme.colors['text-secondary']});">
                ${revenue !== undefined ? `€${revenue.toLocaleString()}` : 'No data'}
            </span>
        `;
        layer.bindTooltip(tooltipContent, {
            sticky: true,
            className: 'custom-leaflet-tooltip',
        });
        
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
        });
    };

    if (!geoJsonData) {
        return <div className="flex items-center justify-center h-full text-text-secondary">Loading map...</div>;
    }

    return (
        <>
            <style>
                {`
                    .custom-leaflet-tooltip {
                        background-color: rgb(${theme.colors.surface}) !important;
                        border: 1px solid rgb(${theme.colors.secondary} / 0.2) !important;
                        color: rgb(${theme.colors['text-primary']}) !important;
                        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    }
                `}
            </style>
            <MapContainer 
                center={[52, 15]} 
                zoom={4} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
                className="rounded-md"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                />
                {geoJsonData && (
                    <GeoJSON 
                        key={JSON.stringify(data) + theme.name} // Re-render on data/theme change
                        data={geoJsonData} 
                        style={style} 
                        onEachFeature={onEachFeature} 
                    />
                )}
            </MapContainer>
        </>
    );
};

export default RevenueMapChart;
