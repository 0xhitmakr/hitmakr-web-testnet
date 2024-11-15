"use client"

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ColorThief from 'colorthief';
import styles from "./styles/Retro.module.css";
import LoaderWhiteSmall from '../../animations/loaders/loaderWhiteSmall';
import { useNameByAddress } from '@/app/config/hitmakrprofiles/HitmakrProfilesFunctions';
import { useAccount } from 'wagmi';
import Link from 'next/link';

const RetroPlayer = ({ data }) => {
  const [dominantColor, setDominantColor] = useState(null);
  const { address } = useAccount();
  const [creatorName, setCreatorName] = useState(null); 

  const { data: nameData, isLoading: nameLoading, error: nameError } = useNameByAddress(data?.creator);

  const imageRef = useRef(null);

  if(data && data.attributes){
    console.log(data.attributes.find(attribute => attribute.trait_type === 'Is Gated')?.value)
  }

  useEffect(() => {
    if (nameData) {
      setCreatorName(nameData);
    }
  }, [nameData]); 

  useEffect(() => {
    const img = imageRef.current;
    if (img && img.complete) {
      getColor();
    } else if (img) {
      img.onload = getColor;
    }
  }, [data.image]);

  const getColor = () => {
    const colorThief = new ColorThief();
    const img = imageRef.current;
    try {
      const color = colorThief.getColor(img);
      setDominantColor(`rgb(${color.join(',')}, 0.75)`);
    } catch (error) {
      console.error("Error getting color:", error);
      setDominantColor('rgb(120, 20, 20)');
    }
  };

  return (
    <div className={styles.retroplayer} style={{ backgroundColor: dominantColor }}>
      <div className={styles.playerContainer}>
        <div className={styles.imageContainer}>
            {data && data.image ?
                <Image
                    ref={imageRef}
                    src={data.image}
                    alt={data.songId}
                    width={200}
                    height={200}
                    className={styles.albumCover}
                    priority
                />
                :
                <LoaderWhiteSmall />
            }
          
        </div>
        <div className={styles.basicDetails}>
            <div className={styles.basicDetailsTitle}>
                    {data && data.name ? 
                        <p>
                            {data.name.length > 20 ? data.name.substring(0, 20) + "..." : data.name}
                        </p>
                        :
                        <p>
                            <LoaderWhiteSmall />
                        </p>
                    }
            </div>
            <div className={styles.basicDetailsOptions}>
                    {nameData &&
                        <>
                        <Link href={`/profile/${nameData}`} className={styles.basicDetailsOption}>
                            {nameData}
                        </Link>
                        </>
                    }
                
                <div className={styles.basicDetailsOption}>
                    {data && data.attributes && 
                        data.attributes.find(attribute => attribute.trait_type === 'Duration')?.value
                    }
                </div>
            </div>
            
        </div>
        <div className={styles.retroPlayPauseButton}>
            <span>
                <i className="fi fi-sr-play" />
            </span>
        </div>
        <div className={styles.retroPlayer}>
            
        </div>
      </div>
    </div>
  );
};

export default RetroPlayer;