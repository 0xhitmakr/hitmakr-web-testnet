"use client";

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FastAverageColor } from 'fast-average-color';
import chroma from 'chroma-js';

const TrianglifyPattern = ({
  imageUrl,
  fallbackAddress = '0x0000000000000000000000000000000000000000',
  height = 300,
  className = '',
}) => {
  const [gradientColors, setGradientColors] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const fac = new FastAverageColor();
    
    const generateColors = async () => {
      if (imageUrl) {
        try {
          const color = await fac.getColorAsync(imageUrl);
          const baseColor = chroma(color.value);
          
          // Generate complementary and analogous colors for rich contrast
          const complement = baseColor.set('hsl.h', '+180');
          const analogous1 = baseColor.set('hsl.h', '+30');
          const analogous2 = baseColor.set('hsl.h', '-30');

          // Create a rich color palette
          const palette = {
            main: baseColor.saturate(1.2).hex(),
            contrast: complement.saturate(0.8).darken(0.5).hex(),
            accent1: analogous1.brighten(0.3).saturate(0.5).hex(),
            accent2: analogous2.darken(0.3).saturate(0.5).hex(),
            dark: baseColor.darken(2).desaturate(0.5).hex()
          };

          setGradientColors(palette);
        } catch (err) {
          console.error('Error analyzing image:', err);
          useFallbackColors();
        }
      } else {
        useFallbackColors();
      }
    };

    const useFallbackColors = () => {
      // Create a hash-based color from the fallback address
      const hash = fallbackAddress.slice(2, 8);
      const baseColor = chroma(`#${hash}`);
      
      setGradientColors({
        main: '#2D3250',
        contrast: '#424769',
        accent1: '#676F9D',
        accent2: '#7C8BBF',
        dark: '#1a1a2e'
      });
    };

    generateColors();
    return () => fac.destroy();
  }, [imageUrl, fallbackAddress, isClient]);

  if (!gradientColors) {
    return null;
  }

  return (
    <div 
      className={`w-full absolute top-0 left-0 -z-10 overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Main radial gradient */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `
            radial-gradient(
              circle at top center,
              ${gradientColors.main}60 0%,
              ${gradientColors.dark} 100%
            )
          `
        }}
      />

      {/* Left side gradient */}
      <div 
        className="absolute inset-0 opacity-60 transition-opacity duration-500"
        style={{
          background: `
            linear-gradient(
              135deg,
              ${gradientColors.accent1}40 0%,
              transparent 50%
            )
          `
        }}
      />

      {/* Right side gradient */}
      <div 
        className="absolute inset-0 opacity-60 transition-opacity duration-500"
        style={{
          background: `
            linear-gradient(
              -135deg,
              ${gradientColors.accent2}40 0%,
              transparent 50%
            )
          `
        }}
      />

      {/* Overlay gradient for depth */}
      <div 
        className="absolute inset-0 opacity-80 mix-blend-soft-light transition-opacity duration-500"
        style={{
          background: `
            linear-gradient(
              180deg,
              ${gradientColors.contrast}30 0%,
              ${gradientColors.dark}90 100%
            )
          `
        }}
      />

      {/* Top vignette effect */}
      <div 
        className="absolute inset-0 opacity-70 transition-opacity duration-500"
        style={{
          background: `
            linear-gradient(
              to bottom,
              ${gradientColors.dark} 0%,
              transparent 20%
            )
          `
        }}
      />

      {/* Subtle noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

TrianglifyPattern.propTypes = {
  imageUrl: PropTypes.string,
  fallbackAddress: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string,
};

export default TrianglifyPattern;