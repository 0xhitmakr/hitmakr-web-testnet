"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/ProfileReleases.module.css";
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import {
  useGetDSRCDetails,
  useHasPurchased,
} from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import Image from "next/image";
import "@flaticon/flaticon-uicons/css/all/all.css";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import { useAccount } from "wagmi";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import HeartButton from "./HeartButton";
import AddToPlaylistModal from "./AddToPlaylistModal";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";
import { useMusicPlayer } from "@/app/config/audio/MusicPlayerProvider";
import HashTagsModal from "@/app/subcomps/hashtags";
import CheckoutModal from "@/app/dsrc/purchase-card/checkout-modal";
import { motion, AnimatePresence } from 'framer-motion';

const EditionCard = ({ editionName, isOwned, isEnabled, price }) => {
  if (!isEnabled) return null;

  const editionColor = isOwned ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 255, 255, 0.1)';
  const borderColor = isOwned ? 'rgba(46, 213, 115, 0.3)' : 'rgba(255, 255, 255, 0.15)';
  
  return (
    <div 
      className={`${styles.editionCard} ${isOwned ? styles.editionCardOwned : ''}`}
      style={{
        background: editionColor,
        borderColor: borderColor
      }}
    >
      <div className={styles.editionInfo}>
        <span className={styles.editionName}>{editionName}</span>
        {price > 0 && (
          <span className={styles.editionPrice}>
            {price / 1000000} USDC
          </span>
        )}
        {isOwned && (
          <span className={styles.editionOwnedBadge}>
            <i className="fi fi-sr-check-circle" />
          </span>
        )}
      </div>
    </div>
  );
};

const AttributeCard = ({ attribute }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatValue = (attr, shouldTruncate = true) => {
    if (!attr?.value) return "";

    const truncate = (value, maxLength) => {
      if (!shouldTruncate) return value;
      return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
    };

    switch (attr.trait_type) {
      case "Duration":
        const parts = attr.value.split(':');
        return parts.length === 3 ? `${parts[1]}:${parts[2]}` : attr.value;
      
      case "Category":
      case "Genre":
      case "Chain":
        return truncate(attr.value, 12);
      
      case "Language":
        return truncate(attr.value, 15);
      
      case "Copyright":
        return truncate(attr.value, 10);
      
      case "License":
        return truncate(attr.value.split(' ').join('\u00A0'), 15);
      
      default:
        return truncate(String(attr.value), 15);
    }
  };

  const getIcon = (type) => {
    const baseOpacity = "opacity-60 group-hover:opacity-90";
    
    switch (type) {
      case "Duration":
        return { 
          icon: "fi fi-rr-clock", 
          color: `text-blue-400 ${baseOpacity}`,
          gradient: "from-blue-500/10"
        };
      case "Category":
        return { 
          icon: "fi fi-rr-apps", 
          color: `text-purple-400 ${baseOpacity}`,
          gradient: "from-purple-500/10"
        };
      case "Language":
        return { 
          icon: "fi fi-rr-language", 
          color: `text-emerald-400 ${baseOpacity}`,
          gradient: "from-emerald-500/10"
        };
      case "Copyright":
        return { 
          icon: "fi fi-rr-copyright", 
          color: `text-amber-400 ${baseOpacity}`,
          gradient: "from-amber-500/10"
        };
      case "Genre":
        return { 
          icon: "fi fi-rr-music", 
          color: `text-pink-400 ${baseOpacity}`,
          gradient: "from-pink-500/10"
        };
      case "License":
        return { 
          icon: "fi fi-rr-file-certificate", 
          color: `text-cyan-400 ${baseOpacity}`,
          gradient: "from-cyan-500/10"
        };
      case "Country":
        return { 
          icon: "fi fi-rr-globe", 
          color: `text-indigo-400 ${baseOpacity}`,
          gradient: "from-indigo-500/10"
        };
      case "Chain":
        return { 
          icon: "fi fi-rr-link-alt", 
          color: `text-orange-400 ${baseOpacity}`,
          gradient: "from-orange-500/10"
        };
      default:
        return { 
          icon: "fi fi-rr-info", 
          color: `text-gray-400 ${baseOpacity}`,
          gradient: "from-gray-500/10"
        };
    }
  };

  if (!attribute?.value || 
      ["Royalty Splits", "Is Gated", "Is Copyright Overwritten", "Editions"].includes(attribute.trait_type)) {
    return null;
  }

  const truncatedValue = formatValue(attribute, true);
  const fullValue = formatValue(attribute, false);
  const hasLongContent = truncatedValue !== fullValue;
  const { icon, color, gradient } = getIcon(attribute.trait_type);

  return (
    <motion.div 
      className="inline-flex items-start mr-6"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div 
        className={`group flex items-start gap-3 relative px-3 py-1.5 rounded-lg transition-all duration-300 
          ${hasLongContent ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
        onClick={() => hasLongContent && setIsExpanded(!isExpanded)}
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300`} />
        
        <div className="relative">
          <motion.div 
            className={`flex items-center h-4 mt-[2px] ${color} transition-all duration-300`}
            whileHover={{ scale: 1.1 }}
          >
            <i className={`${icon} text-[11px]`} />
            {hasLongContent && (
              <motion.i 
                className={`fi ${isExpanded ? 'fi-rr-angle-up' : 'fi-rr-angle-down'} text-[10px] ml-1 opacity-40`}
                initial={{ rotate: 0 }}
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.div>
        </div>
        
        <div className="flex flex-col gap-[2px] relative min-w-[60px]">
          <motion.span 
            className="text-[10px] font-medium text-gray-400/60 uppercase tracking-wider transition-colors duration-300 group-hover:text-gray-400/80"
            layout
          >
            {attribute.trait_type}
          </motion.span>
          
          <AnimatePresence mode="wait">
            <motion.span 
              key={isExpanded ? 'expanded' : 'collapsed'}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="text-[13px] text-white/90 font-light tracking-tight transition-colors duration-300 group-hover:text-white"
            >
              {isExpanded ? fullValue : truncatedValue}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default function DSRCView({ dsrcid, hashTags, songId }) {
  const [metadata, setMetadata] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copyText, setCopyText] = useState("Copy DSRC");
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [modalState, setModalState] = useState({
    show: false,
    title: "",
    description: "",
  });
  const [showHashTags, setShowHashTags] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(null);

  const {
    playTrack,
    playPause,
    isPlaying,
    currentTrack,
    addToQueue,
  } = useMusicPlayer();

  const dropdownRef = useRef(null);
  const { routeTo } = RouterPushLink();
  const { address, isConnected } = useAccount();

  const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(dsrcid);
  const { details, loading: detailsLoading } = useGetDSRCDetails(dsrcAddress);
  const { hasPurchased, loading: purchaseCheckLoading } = useHasPurchased(
    dsrcAddress,
    isConnected ? address : null
  );

  const isLoading = addressLoading || detailsLoading || (isConnected && purchaseCheckLoading);
  const isThisTrackPlaying = currentTrack === dsrcid && isPlaying;

  const allEditionsOwned = isConnected && hasPurchased && 
    Object.values(hasPurchased).every(status => status === true);

  const hasAnyEdition = isConnected && hasPurchased && 
    Object.values(hasPurchased).some(status => status === true);

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
          setMetadata(null);
        }
      }
    };

    fetchMetadata();
  }, [details?.tokenUri]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setCopyText("Copy DSRC");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePlayPause = () => {
    if (currentTrack === dsrcid) {
      playPause();
    } else {
      playTrack(dsrcid);
    }
  };

  const handleAddToQueue = () => {
    addToQueue(dsrcid);
    setModalState({
      show: true,
      title: "Added to Queue",
      description: "DSRC has been added to your queue",
    });
    setShowDropdown(false);
  };

  const handleCopyAddress = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(dsrcAddress);
        setCopyText("Copied!");
      } else {
        prompt("Copy the address manually:", dsrcAddress);
        setCopyText("Manual Copy");
      }

      setTimeout(() => {
        setCopyText("Copy DSRC");
        setShowDropdown(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setModalState({
        show: true,
        title: "Copy Failed",
        description: "Failed to copy DSRC address.",
      });
      setTimeout(() => setCopyText("Copy DSRC"), 2000);
    }
  };

  const handleShare = async () => {
    if (!metadata) return;

    const shareUrl = `${window.location.origin}/dsrc/${dsrcid}`;
    const shareData = {
      title: metadata.name,
      text: `Check out "${metadata.name}" on Hitmakr\nDSRC ID: ${dsrcid}\nDuration: ${
        metadata.attributes.find((attr) => attr.trait_type === "Duration")?.value || "N/A"
      }\n`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const fallbackText = `${shareData.text}\n${shareUrl}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fallbackText);
          setModalState({
            show: true,
            title: "Share Success",
            description: "Share link copied to clipboard!",
          });
        } else {
          prompt("Copy this share link:", fallbackText);
        }
      }
    } catch (err) {
      console.error("Error sharing:", err);
    } finally {
      setShowDropdown(false);
    }
  };

  const handleAddHashTags = () => {
    if (!isConnected) {
      setModalState({
        show: true,
        title: "Connect Wallet",
        description: "Please connect your wallet to add hashtags.",
      });
      return;
    }
    setShowHashTags(true);
  };

  const handleOptionClick = (option) => {
    switch (option) {
      case "add":
        handleAddToQueue();
        break;
      case "playlist":
        setShowAddToPlaylist(true);
        setShowDropdown(false);
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
        setShowDropdown(false);
    }
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      setModalState({
        show: true,
        title: "Connect Wallet",
        description: "Please connect your wallet to claim this DSRC.",
      });
      return;
    }

    if (allEditionsOwned) {
      setModalState({
        show: true,
        title: "Already Owned",
        description: "You already own all editions of this DSRC.",
      });
      return;
    }

    setShowPurchaseModal({
      id: songId,
      image: metadata?.image,
      name: metadata?.name,
      creator: metadata?.creator,
      dsrcid,
      royalty: metadata?.attributes.find(attr => attr.trait_type === "Royalty Splits")?.value,
    });
  };

  if (isLoading || !metadata) {
    return (
      <div className={styles.loading}>
        <LoaderWhiteSmall />
      </div>
    );
  }

  if (!details || !metadata) {
    return (
      <div className={styles.error}>
        <LoaderWhiteSmall />
      </div>
    );
  }

  const filteredAttributes = metadata.attributes.filter(
    attr => !["Royalty Splits"].includes(attr.trait_type) && attr.value != null
  );

  return (
    <>
      <div className={`${styles.dsrcItem} ${allEditionsOwned ? styles.allEditionsOwned : ''}`}>
        <div className={styles.menuContainer} ref={dropdownRef}>
          <button
            className={styles.menuButton}
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="More options"
          >
            <i className="fi fi-sr-menu-dots-vertical" />
          </button>
          {showDropdown && (
            <div className={styles.dropdown}>
              <button onClick={() => handleOptionClick("copy")}>
                <i className={`fi ${copyText === "Copied!" ? "fi-rr-check" : "fi-rr-copy"}`} />
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
              {isConnected && address?.toLowerCase() === metadata?.creator?.toLowerCase() && songId && (
                <button onClick={() => handleOptionClick("hashtags")}>
                  <i className="fi fi-rr-tags" />
                  Add hashtags
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.dsrcContent}>
          <div className={styles.imageWrapper}>
            <div className={styles.imageContainer}>
              <Image
                src={metadata.image || `https://api.dicebear.com/9.x/shapes/svg?seed=${dsrcid}`}
                width={180}
                height={180}
                alt={`${metadata.name} only on Hitmakr`}
                className={styles.coverImage}
                unoptimized
              />
              <div className={styles.playOverlay}>
                <button
                  onClick={handlePlayPause}
                  className={`${styles.playButton} ${isThisTrackPlaying ? styles.playing : ""}`}
                  aria-label={isThisTrackPlaying ? "Pause" : "Play"}
                >
                  <i className={`fi ${isThisTrackPlaying ? "fi-sr-pause" : "fi-sr-play"}`} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.detailsWrapper}>
            <h1 className={styles.title} onClick={() => routeTo(`/dsrc/${dsrcid}`)}>
              {metadata.name?.length > 30 ? `${metadata.name.slice(0, 30)}...` : metadata.name}
            </h1>
            
            <div className={styles.idContainer}>
              <p className={styles.description} onClick={() => routeTo(`/profile?address=${metadata.creator}`)}>
                <GetUsernameByAddress address={metadata.creator} />
              </p>
              <span className={styles.chainPill}>
                {metadata.attributes.find(attr => attr.trait_type === "Chain")?.value || details.selectedChain}
              </span>
            </div>

            {Array.isArray(hashTags) && hashTags.length > 0 && (
              <div className={styles.hashTags}>
                {hashTags.map((tag) => (
                  <span key={tag} className="inline-block px-2 py-1 mr-2 text-xs text-white/70 bg-white/5 rounded-full hover:bg-white/10 transition-colors duration-200">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className={styles.attributesWrapper}>
              <div className={styles.attributesRow}>
                {filteredAttributes.map((attr, index) => (
                  <AttributeCard key={`${attr.trait_type}-${index}`} attribute={attr} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.dsrcMetadata}>
          <div className={styles.dsrcMetadataLeft}>
            <div className={styles.dsrcMetadataLeftOptions}>
              <div onClick={handlePlayPause} className={styles.dsrcMetadataLeftOption}>
                <i className={`fi ${isThisTrackPlaying ? "fi-sr-pause" : "fi-sr-play"}`} />
              </div>
              <div className={styles.dsrcMetadataLeftOption}>
                <HeartButton
                  dsrcId={dsrcid}
                  showModal={(modalState) => setModalState(modalState)}
                />
              </div>
              <div onClick={() => routeTo(`/dsrc/${dsrcid}/comments`)} className={styles.dsrcMetadataLeftOption}>
                <i className="fi fi-rr-smiley-comment-alt"></i>
              </div>
              <div onClick={() => routeTo(`/dsrc/${dsrcid}`)} className={styles.dsrcMetadataLeftOption}>
                <i className="fi fi-rr-heart-rate"></i>
              </div>
            </div>
          </div>

          <div className={styles.dsrcMetadataRight}>
            <div className={styles.dsrcMetadataPurchaseButton}>
              <button 
                onClick={handlePurchase} 
                disabled={allEditionsOwned}
                className={allEditionsOwned ? styles.allEditionsOwnedButton : ''}
              >
                {allEditionsOwned ? (
                  <>
                    Collected <i className="fi fi-sr-check-circle"></i>
                  </>
                ) : hasAnyEdition ? (
                  "Collect More"
                ) : (
                  "Collect"
                )}
              </button>
            </div>
          </div>
        </div>

        {isConnected && hasPurchased && (
          <div className={styles.editionsStatus}>
            <EditionCard
              editionName="Streaming"
              isOwned={hasPurchased.streaming}
              isEnabled={details.editions.streaming.isEnabled}
              price={Number(details.editions.streaming.price)}
            />
            <EditionCard
              editionName="Collectors"
              isOwned={hasPurchased.collectors}
              isEnabled={details.editions.collectors.isEnabled}
              price={Number(details.editions.collectors.price)}
            />
            <EditionCard
              editionName="Licensing"
              isOwned={hasPurchased.licensing}
              isEnabled={details.editions.licensing.isEnabled}
              price={Number(details.editions.licensing.price)}
            />
          </div>
        )}
      </div>

      {showAddToPlaylist && (
        <AddToPlaylistModal
          dsrcId={dsrcid}
          onClose={() => setShowAddToPlaylist(false)}
          showSuccessMessage={(title, description) =>
            setModalState({
              show: true,
              title,
              description,
            })
          }
        />
      )}
      
      {showHashTags && (
        <HashTagsModal
          closeFunction={() => setShowHashTags(false)}
          id={songId}
          hashTags={hashTags}
        />
      )}

      {showPurchaseModal && (
        <CheckoutModal
          closeFunction={() => setShowPurchaseModal(null)}
          data={showPurchaseModal}
        />
      )}

      {modalState.show && (
        <HitmakrMiniModal
          title={modalState.title}
          description={modalState.description}
          closeButton={<i className="fi fi-br-cross-small"></i>}
          closeFunction={() =>
            setModalState({
              show: false,
              title: "",
              description: "",
            })
          }
          isAction={true}
        />
      )}
    </>
  );
}