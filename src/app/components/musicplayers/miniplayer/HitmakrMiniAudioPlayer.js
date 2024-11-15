"use client"

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import styles from "./styles/MiniAudioPlayer.module.css";
import '@flaticon/flaticon-uicons/css/all/all.css';
import { debounce } from 'lodash';

const HitmakrMiniAudioPlayer = ({ selectedFile }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const [waveformBars, setWaveformBars] = useState(150);
  const [audioBuffer, setAudioBuffer] = useState(null);

  const generateWaveformData = useCallback((buffer, bars) => {
    if (!buffer) return;

    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / bars);
    const waveform = [];

    for (let i = 0; i < bars; i++) {
      const start = i * blockSize;
      const end = Math.min((i + 1) * blockSize, channelData.length);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += Math.abs(channelData[j]);
      }
      const amplitude = sum / (end - start);
      waveform.push(amplitude);
    }

    const maxAmplitude = Math.max(...waveform);
    const normalizedWaveform = waveform.map(amp => amp / maxAmplitude);
    setWaveformData(normalizedWaveform);
  }, []);

  useEffect(() => {
    const calculateWaveformBars = () => {
      let newBars = 150;
      if (window.innerWidth <= 550) {
        newBars = 35;
      } else if (window.innerWidth <= 950) {
        newBars = 100;
      }
      return newBars;
    };

    const debouncedHandleResize = debounce(() => {
      setWaveformBars(calculateWaveformBars());
    }, 200);

    debouncedHandleResize();
    window.addEventListener('resize', debouncedHandleResize);
    return () => window.removeEventListener('resize', debouncedHandleResize);
  }, []);

  useEffect(() => {
    if (audioBuffer) {
      generateWaveformData(audioBuffer, waveformBars);
    }
  }, [waveformBars, audioBuffer, generateWaveformData]);


  useEffect(() => {
    let objectUrl;
    let mounted = true;

    if (audioRef.current && selectedFile && mounted) {
      objectUrl = URL.createObjectURL(selectedFile);
      audioRef.current.src = objectUrl;

      const onLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
      };

      const onTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
      };

      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current.addEventListener("loadedmetadata", onLoadedMetadata);
      audioRef.current.addEventListener("timeupdate", onTimeUpdate);
      audioRef.current.addEventListener("ended", onEnded);

      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        selectedFile.arrayBuffer().then(arrayBuffer => 
            audioContext.decodeAudioData(arrayBuffer)
        ).then(decodedBuffer => {
            if(mounted) {
                setAudioBuffer(decodedBuffer);
                generateWaveformData(decodedBuffer, waveformBars);
            }
        });

      return () => {
        mounted = false;
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        if (audioRef.current) {
          audioRef.current.removeEventListener("loadedmetadata", onLoadedMetadata);
          audioRef.current.removeEventListener("timeupdate", onTimeUpdate);
          audioRef.current.removeEventListener("ended", onEnded);
        }
      };
    }

  }, [selectedFile, volume, playbackRate, generateWaveformData]);


  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);


  const handlePlayPause = () => {
    if (audioRef.current && selectedFile) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
      }
    }
  };


  const handleSliderChange = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);

    if (audioRef.current && selectedFile) {
      audioRef.current.currentTime = time;
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Error playing audio after seek:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);
  const handleVolumeMouseEnter = () => setIsHoveringVolume(true);
  const handleVolumeMouseLeave = () => setIsHoveringVolume(false);

  const toggleVolumeControl = () => {
    setShowVolumeControl(!showVolumeControl);
  };

  if (!selectedFile) {
    return <div className={styles.audioPlayerContainer}>No audio file selected</div>;
  }


  const renderWaveform = useMemo(() => {
    const progressPercentage = (currentTime / duration) * 100;
    return waveformData.map((amplitude, index) => {
      const isFinished = index / waveformData.length <= progressPercentage / 100;
      const animationStyle = isFinished ? { animation: `${styles.barAnimation} 0.5s ease-in-out infinite alternate` } : {};
      return (
        <div
          key={index}
          className={`${styles.waveformBar} ${isFinished ? styles.finishedBar : ''}`}
          style={{
            height: `${amplitude * 100}%`,
            backgroundColor: isFinished ? "#8023E4" : '#4D4D4D',
            ...animationStyle
          }}
        />
      );
    });
  }, [waveformData, currentTime, duration]);

  return (
    <div className={styles.audioPlayerContainer}>
      <audio ref={audioRef} preload="auto" />
      <div className={styles.controls}>
        <button className={styles.playPauseButton} onClick={handlePlayPause}>
          {isPlaying ? (<i className="fi fi-sr-pause" />) : (<i className="fi fi-sr-play" />)}
        </button>
        <div className={styles.timeDisplay}>
          {formatTime(currentTime)}
        </div>
        <div
          className={styles.sliderContainer}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
            <div className={styles.waveformContainer}>
              {renderWaveform}
            </div>
          <input
            type="range"
            className={`${styles.timeSlider} ${isHovering ? styles.hovering : ''}`}
            min="0"
            max={duration}
            step="0.01"
            value={currentTime}
            onChange={handleSliderChange}
            disabled={!duration}
          />
        </div>
        <div className={styles.timeDisplay}>
          {formatTime(duration)}
        </div>

        <div className={styles.volumeControlContainer}>
          <button className={styles.volumeButton} onClick={toggleVolumeControl}>
            <i className={volume === 0 ? "fi fi-sr-volume-mute" : "fi fi-sr-volume"}></i>
          </button>
          {showVolumeControl && (
            <div
              className={styles.volumeSliderContainer}
              onMouseEnter={handleVolumeMouseEnter}
              onMouseLeave={handleVolumeMouseLeave}
            >
              <input
                type="range"
                className={`${styles.volumeSlider} ${isHoveringVolume ? styles.hovering : ''}`}
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  background: `linear-gradient(to right, ${isHoveringVolume ? "#ffffff" : "#FFFFFF"} 0%, ${isHoveringVolume ? "#ffffff" : "#FFFFFF"} ${volume * 100}%, #4D4D4D ${volume * 100}%, #4D4D4D 100%)`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default HitmakrMiniAudioPlayer;