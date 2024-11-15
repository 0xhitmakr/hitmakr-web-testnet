"use client";

import { useRef, useEffect, useState } from 'react';
import { useMusicPlayer } from '@/app/config/audio/MusicPlayerProvider';
import Image from 'next/image';
import styles from "../styles/MainPlayer.module.css"
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import GetUsernameByAddress from '@/app/helpers/profile/GetUsernameByAddress';

export default function QueueItem({ dsrcId, index, playTrack }) {
    const [itemMetadata, setItemMetadata] = useState(null);
    const { queueMetadata, currentTrack } = useMusicPlayer();
    const { dsrcAddress } = useGetDSRC(dsrcId);
    const { details } = useGetDSRCDetails(dsrcAddress);

    const defaultDisplayValues = {
        image: `https://api.dicebear.com/9.x/glass/svg?seed=${dsrcId}`,
        name: 'Loading...',
        creator: 'Unknown Artist',
        attributes: []
    };

    useEffect(() => {
        const fetchData = async () => {
          try {
            if (!details?.tokenUri) return;

            const response = await fetch(details.tokenUri);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setItemMetadata(data);

          } catch (error) {
            console.error(`Error fetching metadata for ${dsrcId}:`, error);
            setItemMetadata(defaultDisplayValues);
          }
        };

        if (dsrcId && !itemMetadata) {
          fetchData();
        }
    }, [dsrcId, details, itemMetadata]); 

    const displayData = itemMetadata || defaultDisplayValues;

    return (
        <div 
            className={`${styles.queueItem} ${currentTrack === dsrcId ? styles.currentTrack : ''}`} 
            onClick={() => playTrack(dsrcId)}
        >
            <Image
                src={displayData.image}
                alt={displayData.name || "Track"}
                width={40}
                height={40}
                className={styles.queueItemCover}
                unoptimized={true}
            />
            <div className={styles.queueItemInfo}>
                <div className={styles.queueItemTitle}>{displayData.name}</div>
                <div className={styles.queueItemArtist}><GetUsernameByAddress address={displayData.creator}/></div>
            </div>
            <div className={styles.queueItemDuration}>
                {displayData.attributes ? displayData.attributes.find(attr => attr.trait_type === 'Duration')?.value || '--:--' : '--:--'}
            </div>
        </div>
    );
}
