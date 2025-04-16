"use client";

import { useParams } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import ColorThief from "colorthief";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import styles from "./styles/CollectionId.module.css";
import Link from "next/link";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import DSRCPlaylistView from "./components/DSRCPlaylistView";
import { useMusicPlayer } from "@/app/config/audio/MusicPlayerProvider";

export default function CollectionDetails() {
  const params = useParams();
  const collectionId = params.collectionId;
  const { address, chainId: wagmiChainId } = useAccount();
  const { routeTo } = RouterPushLink();

  const {
    playTrack,
    addToQueue,
    isPlaying,
    playPause,
    currentTrack,
    clearQueue,
  } = useMusicPlayer();

  const [collection, setCollection] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [dominantColor, setDominantColor] = useState("rgb(88, 56, 163)");

  const imageRef = useRef(null);
  const colorThiefRef = useRef(new ColorThief());

  const getRequestHeaders = () => {
    const authToken = localStorage.getItem("@appkit/siwx-auth-token");
    const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");
    return {
      Authorization: `Bearer ${authToken}`,
      "x-nonce-token": nonceToken,
      "x-user-address": address,
      "x-chain-id": wagmiChainId?.toString() || "",
      "Content-Type": "application/json",
    };
  };

  const handleCollectionPlay = async () => {
    if (tracks.length === 0) return;

    if (currentTrack?.dsrcId === tracks[0].dsrcId) {
      playPause();
      return;
    }

    clearQueue();
    playTrack(tracks[0].dsrcId);
    tracks.slice(1).forEach((track) => addToQueue(track.dsrcId));

    if (hasMore) {
      try {
        let nextPage = page + 1;
        while (true) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/collections/${collectionId}/tracks?page=${nextPage}&limit=20`,
            {
              headers: getRequestHeaders(),
            }
          );

          if (!response.ok) break;

          const data = await response.json();
          data.tracks.forEach((track) => addToQueue(track.dsrcId));

          if (!data.pagination.hasNextPage) break;
          nextPage++;
        }
      } catch (error) {
        console.error("Error fetching additional tracks for queue:", error);
      }
    }
  };

  const getDominantColor = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const imageDataUrl = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const htmlImage = document.createElement("img");
        htmlImage.crossOrigin = "Anonymous";
        htmlImage.src = imageDataUrl;

        htmlImage.onload = () => {
          try {
            const color = colorThiefRef.current.getColor(htmlImage);
            URL.revokeObjectURL(imageDataUrl);
            resolve(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
          } catch (error) {
            console.error("Error getting dominant color:", error);
            resolve("rgb(88, 56, 163)");
          }
        };

        htmlImage.onerror = () => {
          URL.revokeObjectURL(imageDataUrl);
          resolve("rgb(88, 56, 163)");
        };
      });
    } catch (error) {
      console.error("Error fetching image:", error);
      return "rgb(88, 56, 163)";
    }
  };

  const fetchCollectionDetails = async () => {
    if (!collectionId || !address) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/collections/${collectionId}`,
        {
          headers: getRequestHeaders(),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch collection");
      const data = await response.json();
      setCollection(data.collection);

      if (data.collection.imageUrl) {
        const color = await getDominantColor(data.collection.imageUrl);
        setDominantColor(color);
      }
    } catch (error) {
      console.error("Error fetching collection:", error);
      setError("Failed to load collection");
    }
  };

  const fetchTracks = async (pageNum) => {
    if (!collectionId || !address || (pageNum > 1 && !hasMore)) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/collections/${collectionId}/tracks?page=${pageNum}&limit=20`,
        {
          headers: getRequestHeaders(),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch tracks");
      const data = await response.json();

      if (pageNum === 1) {
        setTracks(data.tracks);
      } else {
        setTracks((prev) => [...prev, ...data.tracks]);
      }

      setHasMore(data.pagination.hasNextPage);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      setError("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      await fetchCollectionDetails();
      await fetchTracks(1);
    };

    if (collectionId && address && wagmiChainId) {
      initializeData();
    }
  }, [collectionId, address, wagmiChainId]);

  if (loading && !collection) {
    return (
      <div className={styles.loadingContainer}>
        <LoaderWhiteSmall />
      </div>
    );
  }

  if (error && !collection) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  if (!collection) {
    return <div className={styles.errorContainer}>Collection not found</div>;
  }

  return (
    <div
      className={styles.playlistContainer}
      style={{
        background: `linear-gradient(180deg, ${dominantColor}99 0%, #121212 100%)`,
      }}
    >
      <section className={styles.playlistHeader}>
        <div className={styles.headerContent}>
          <div className={styles.coverImage}>
            <Image
              ref={imageRef}
              src={collection.imageUrl}
              alt={collection.name}
              width={232}
              height={232}
              className={styles.coverImg}
              crossOrigin="anonymous"
              priority
              unoptimized
            />
            <div className={styles.playOverlay}>
              <button
                className={styles.playButton}
                onClick={handleCollectionPlay}
              >
                <i
                  className={
                    isPlaying && currentTrack?.dsrcId === tracks[0]?.dsrcId
                      ? "fi fi-sr-pause"
                      : "fi fi-sr-play"
                  }
                ></i>
              </button>
            </div>
          </div>

          <div className={styles.playlistInfo}>
            <span className={styles.playlistType}>
              {collection.type
                ? collection.type.charAt(0).toUpperCase() +
                  collection.type.slice(1)
                : "Collection"}
            </span>
            <h1 className={styles.playlistTitle}>{collection.name}</h1>
            <div className={styles.playlistMeta}>
              <Link
                href={`/profile?address=${collection.creator}`}
                className={styles.creatorName}
              >
                <GetUsernameByAddress address={collection.creator} />
              </Link>
              <span className={styles.metaDivider}>•</span>
              <span className={styles.trackCount}>
                {collection.totalTracks}{" "}
                {collection.totalTracks === 1 ? "DSRC" : "DSRCs"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.tracksSection}>
        {tracks.length > 0 ? (
          <>
            <div className={styles.trackList}>
              {tracks.map((track) => (
                <DSRCPlaylistView
                  key={track.dsrcId}
                  dsrcId={track.dsrcId}
                  playlistId={collectionId}
                />
              ))}
            </div>

            {hasMore && (
              <div className={styles.loadMore}>
                <button
                  onClick={() => fetchTracks(page + 1)}
                  disabled={loading}
                  className={styles.loadMoreButton}
                >
                  {loading ? (
                    <LoaderWhiteSmall />
                  ) : (
                    <i className="fi fi-sr-arrow-circle-down"></i>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyPlaylist}>
            <i className="fi fi-rr-music-note"></i>
            <p>This collection is empty</p>
            <span>No DSRCs have been added yet</span>
          </div>
        )}
      </section>
    </div>
  );
}
