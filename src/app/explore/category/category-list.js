// CategoryList.js
"use client";

import React, { useState, useEffect } from "react";
import styles from "../../subcomps/styles/TopLiked.module.css";
import SkeletonCard from "../../subcomps/SkeletonCard";
import DSRCCard from "../../subcomps/DSRCCard";
import AddToPlaylistModal from "../../profile/components/releases/components/AddToPlaylistModal";
import HitmakrMiniModal from "../../components/modals/HitmakrMiniModal";
import secondStyles from "../genre/genre.module.css";
const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

export default function CategoryList({ searchParams }) {
  const [topDSRCIds, setTopDSRCIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedDsrcId, setSelectedDsrcId] = useState(null);
  const [modalState, setModalState] = useState({
    show: false,
    title: "",
    description: "",
  });

  

  useEffect(() => {
    const fetchTopLiked = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/song/category/${
            searchParams?.category || "music"
          }?country=${searchParams?.location || ""}&genre=${searchParams.genre || ""}&date=${
            searchParams.date || ""
          }&likes=${searchParams.likes || ""}`
        );
        if (!response.ok) throw new Error("Failed to fetch top DSRCs");
        const data = await response.json();
        setTopDSRCIds(data.songs);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    

    fetchTopLiked();
  }, [searchParams]);


  const handleDSRCError = (dsrcId) => {
    setTopDSRCIds((prev) => prev.filter((song) => song.dsrcId !== dsrcId));
  };

  if (loading) {
    return (
      <div className={styles.topLikedContainer}>
        <div className={styles.scrollContainer}>
          {[...Array(6)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!loading && topDSRCIds?.length === 0)
    return (
      <p
        style={{
          textAlign: "center",
          marginTop: "50px",
          fontWeight: "600",
          fontSize: "1.5rem",
        }}
      >
        No results find
      </p>
    );

  return (
    <div className={styles.topLikedContainer}>
      <div className={secondStyles.scrollContainer}>
        {topDSRCIds.map((song, idx) => (
          <DSRCCard
            key={idx}
            dsrcId={song.dsrcId}
            onError={handleDSRCError}
            showModal={setModalState}
            showStats={true}
            hashTags={song?.hashTags}
            songId={song?._id}
            isExplore
          />
        ))}
      </div>

      {showAddToPlaylist && (
        <AddToPlaylistModal
          dsrcId={selectedDsrcId}
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
    </div>
  );
}