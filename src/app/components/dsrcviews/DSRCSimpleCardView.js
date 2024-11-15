

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import styles from "./styles/DSRCSimpleCardView.module.css"

const DSRCSimpleCardView = ({ dsrcId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(dsrcId);
  const { details, loading: detailsLoading } = useGetDSRCDetails(dsrcAddress);

  const isLoading = addressLoading || detailsLoading;

  useEffect(() => {
    const fetchMetadata = async () => {
      if (details?.tokenUri) {
        try {
          const response = await fetch(details.tokenUri);
          if (!response.ok) throw new Error('Failed to fetch metadata');
          const data = await response.json();
          setMetadata(data);
        } catch (error) {
          console.error("Error fetching metadata:", error);
          setMetadata(null);
        }
      }
    };

    fetchMetadata();
  }, [details?.tokenUri]);

  const truncateText = (text, maxLength = 20) => {
    if (typeof text !== 'string') return text;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (isLoading || !metadata) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.dsrcCard}>
      <div className={styles.imageContainer}>
        <Image
          src={metadata.image}
          width={48}
          height={48}
          alt={`${metadata.name} on Hitmakr`}
          className={styles.coverImage}
          unoptimized
        />
        <button
          className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <i className={`fi ${isPlaying ? 'fi-sr-pause' : 'fi-sr-play'}`} />
        </button>
      </div>
      <div className={styles.dsrcInfo}>
        <h3 className={styles.dsrcName}>{truncateText(metadata.name)}</h3>
      </div>
    </div>
  );
};

export default DSRCSimpleCardView;