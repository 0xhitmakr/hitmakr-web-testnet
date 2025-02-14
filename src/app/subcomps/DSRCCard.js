"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import HeartButton from "../profile/components/releases/components/HeartButton";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";
import { useMusicPlayer } from "@/app/config/audio/MusicPlayerProvider";
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import AddToPlaylistModal from "../profile/components/releases/components/AddToPlaylistModal";
import styles from "./styles/TopLiked.module.css";
import SkeletonCard from "./SkeletonCard";
import HashTagsModal from "./hashtags";

export default function DSRCCard({
  dsrcId,
  onError,
  showModal,
  showStats = false,
  stats = null,
  statLabel,
  hashTags,
  isExplore = false,
  songId,
}) {
  const [metadata, setMetadata] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [copyText, setCopyText] = useState("Copy DSRC");
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showHashTags, setShowHashTags] = useState(false);

  const dropdownRef = useRef(null);
  const { routeTo } = RouterPushLink();
  const { address } = useAccount();

  const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(dsrcId);
  const { details, loading: detailsLoading } = useGetDSRCDetails(dsrcAddress);

  const { playTrack, playPause, isPlaying, currentTrack, addToQueue } =
    useMusicPlayer();

  const isThisTrackPlaying = currentTrack === dsrcId && isPlaying;

  useEffect(() => {
    const fetchMetadata = async () => {
      if (details?.tokenUri) {
        try {
          const response = await fetch(details.tokenUri);
          if (!response.ok) throw new Error("Failed to fetch metadata");
          const data = await response.json();
          setMetadata(data);
        } catch (error) {
          console.error("Error fetching metadata:", error);
          onError?.(dsrcId);
        }
      }
    };

    fetchMetadata();
  }, [details?.tokenUri, dsrcId, onError]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(false);
        setCopyText("Copy DSRC");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (addressLoading || detailsLoading || !metadata) {
    return <SkeletonCard />;
  }

  const handlePlayPause = () => {
    if (currentTrack === dsrcId) {
      playPause();
    } else {
      playTrack(dsrcId);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(dsrcAddress);
      setCopyText("Copied!");
      setTimeout(() => {
        setCopyText("Copy DSRC");
        setActiveDropdown(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      showModal({
        show: true,
        title: "Copy Failed",
        description: "Failed to copy DSRC Address.",
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/dsrc/${dsrcId}`;
    const shareData = {
      title: metadata.name,
      text: `Check out "${metadata.name}" on Hitmakr\nDSRC ID: ${dsrcId}\n`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const fallbackText = `${shareData.text}\n${shareUrl}`;
        await navigator.clipboard.writeText(fallbackText);
        showModal({
          show: true,
          title: "Share Success",
          description: "Share link copied to clipboard!",
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
      showModal({
        show: true,
        title: "Share Failed",
        description: "Failed to share DSRC.",
      });
    } finally {
      setActiveDropdown(false);
    }
  };

  const handleAddToQueue = () => {
    addToQueue(dsrcId);
    showModal({
      show: true,
      title: "Added to Queue",
      description: "DSRC has been added to your queue",
    });
    setActiveDropdown(false);
  };

  const handleAddHashTags = () => {
    setShowHashTags(true);
  };

  const handleOptionClick = (option) => {
    if (!address && (option === "playlist" || option === "hashtags")) {
      showModal({
        show: true,
        title: "Connect Wallet",
        description: "Please connect your wallet to perform this action.",
      });
      return;
    }

    switch (option) {
      case "add":
        handleAddToQueue();
        break;
      case "playlist":
        setShowAddToPlaylist(true);
        setActiveDropdown(false);
        break;
      case "copy":
        handleCopyAddress();
        break;
      case "share":
        handleShare();
        break;
      case "hashtags":
        handleAddHashTags();
        break;
      default:
        setActiveDropdown(false);
    }
  };

  return (
    <>
      <div
        className={styles.dsrcCard}
        style={{
          maxWidth: isExplore ? "100%" : "180px",
        }}
      >
        <div className={styles.menuContainer} ref={dropdownRef}>
          <button
            className={styles.menuButton}
            onClick={() => setActiveDropdown(!activeDropdown)}
            aria-label="More options"
          >
            <i className="fi fi-sr-menu-dots-vertical" />
          </button>
          {activeDropdown && (
            <div className={styles.dropdown}>
              <button onClick={() => handleOptionClick("copy")}>
                <i
                  className={`fi ${
                    copyText === "Copied!" ? "fi-rr-check" : "fi-rr-copy"
                  }`}
                />
                {copyText}
              </button>
              <button onClick={() => handleOptionClick("share")}>
                <i className="fi fi-rr-share" />
                Share
              </button>
              <button onClick={() => handleOptionClick("add")}>
                <i className="fi fi-rr-queue" />
                Add to queue
              </button>
              <button onClick={() => handleOptionClick("playlist")}>
                <i className="fi fi-rr-list-music" />
                Add to playlist
              </button>
              {address === details?.creator && songId && (
                <button onClick={() => handleOptionClick("hashtags")}>
                  <i className="fi fi-rr-tags" />
                  Add hashtags
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.imageContainer}>
          <Image
            src={
              metadata.image.includes("undefined")
                ? `https://api.dicebear.com/9.x/shapes/svg?seed=${dsrcId}`
                : metadata.image
            }
            alt={metadata.name}
            width={180}
            height={180}
            className={styles.coverImage}
            unoptimized
          />
          <div className={styles.playOverlay}>
            <button
              onClick={handlePlayPause}
              className={`${styles.playButton} ${
                isThisTrackPlaying ? styles.playing : ""
              }`}
              aria-label={isThisTrackPlaying ? "Pause" : "Play"}
            >
              <i
                className={`fi ${
                  isThisTrackPlaying ? "fi-sr-pause" : "fi-sr-play"
                }`}
              />
            </button>
          </div>
        </div>

        <div className={styles.dsrcInfo}>
          <h3
            className={styles.title}
            onClick={() => routeTo(`/dsrc/${dsrcId}`)}
            title={metadata.name}
          >
            {metadata.name}
          </h3>
          <div className={styles.creatorInfo}>
            <p
              className={styles.creator}
              onClick={() => routeTo(`/profile?address=${details.creator}`)}
            >
              <GetUsernameByAddress address={details.creator} />
            </p>
            
          </div>

          {hashTags?.length > 0 && (
            <div className={styles.hashTags}>
              {hashTags?.map((value) => (
                <span key={value}>#{value}</span>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <div onClick={handlePlayPause} className={styles.actionButton}>
              <i
                className={`fi ${
                  isThisTrackPlaying ? "fi-sr-pause" : "fi-sr-play"
                }`}
              />
            </div>
            <HeartButton dsrcId={dsrcId} showModal={showModal} />
            <button
              className={styles.actionButton}
              onClick={() => routeTo(`/dsrc/${dsrcId}/comments`)}
              aria-label="Comments"
            >
              <i className="fi fi-rr-smiley-comment-alt" />
            </button>
          </div>
        </div>
      </div>

      {showHashTags && (
        <HashTagsModal
          closeFunction={() => setShowHashTags(false)}
          id={songId}
          hashTags={hashTags}
        />
      )}

      {showAddToPlaylist && (
        <AddToPlaylistModal
          dsrcId={dsrcId}
          onClose={() => setShowAddToPlaylist(false)}
          showSuccessMessage={(title, description) => {
            showModal({
              show: true,
              title,
              description,
            });
          }}
        />
      )}
    </>
  );
}
