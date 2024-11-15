"use client";

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FastAverageColor } from 'fast-average-color';
import trianglify from 'trianglify';

const TrianglifyPattern = ({
  imageUrl,
  fallbackAddress = '0x0000000000000000000000000000000000000000',
  height = 200,
  cellSize = 50,
  variance = 0.75,
  className = '',
  borderRadius = '0.5rem',
}) => {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dominantColors, setDominantColors] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Get dominant colors from image or fallback to wallet colors
  useEffect(() => {
    if (!isClient) return; // Only run on client side

    const fac = new FastAverageColor();
    
    const getColors = async () => {
      if (imageUrl) {
        try {
          const color = await fac.getColorAsync(imageUrl);
          const rgb = color.value.slice(0, 3);
          
          // Generate a color palette from the dominant color
          const r = rgb[0], g = rgb[1], b = rgb[2];
          setDominantColors([
            `rgb(${r}, ${g}, ${b})`,
            `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`,
            `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`
          ]);
        } catch (err) {
          console.error('Error getting average color, falling back to address colors:', err);
          useFallbackColors();
        }
      } else {
        useFallbackColors();
      }
    };

    const useFallbackColors = () => {
      const cleanAddress = fallbackAddress.replace('0x', '').padEnd(40, '0');
      setDominantColors([
        `#${cleanAddress.slice(0, 6)}`,
        `#${cleanAddress.slice(6, 12)}`,
        `#${cleanAddress.slice(12, 18)}`
      ]);
    };

    getColors();

    return () => {
      fac.destroy();
    };
  }, [imageUrl, fallbackAddress, isClient]);

  // Generate pattern when colors or container width changes
  useEffect(() => {
    if (!isClient || !containerRef.current || !containerWidth || !dominantColors || !trianglify) return;

    const container = containerRef.current;

    const generatePattern = async () => {
      try {
        // Generate pattern using container's width
        const pattern = trianglify({
          width: containerWidth,
          height,
          cellSize,
          variance,
          seed: imageUrl || fallbackAddress,
          xColors: dominantColors,
          yColors: 'match',
          strokeWidth: 0.5,
          fill: true,
          colorSpace: 'rgb'
        });

        container.innerHTML = '';
        const svg = pattern.toSVG();
        container.appendChild(svg);

        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.display = 'block';
      } catch (error) {
        console.error('Error generating Trianglify pattern:', error);
      }
    };

    generatePattern();
  }, [dominantColors, containerWidth, height, cellSize, variance, imageUrl, fallbackAddress, isClient]);

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ 
        height,
        borderRadius,
        overflow: 'hidden'
      }}
    />
  );
};

TrianglifyPattern.propTypes = {
  imageUrl: PropTypes.string,
  fallbackAddress: PropTypes.string,
  height: PropTypes.number,
  cellSize: PropTypes.number,
  variance: PropTypes.number,
  className: PropTypes.string,
  borderRadius: PropTypes.string,
};

export default TrianglifyPattern;