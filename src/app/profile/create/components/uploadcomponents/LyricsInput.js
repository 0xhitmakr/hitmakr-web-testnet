"use client";

import React, { useState } from "react";
import styles from "../../styles/Create.module.css";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";

const LyricsInput = () => {
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });
  const [lyricsPreview, setLyricsPreview] = useState("");
  const [selectedLyricsFile, setSelectedLyricsFile] = useState(null);

  const handleLyricsSelect = (file) => {
    const allowedExtensions = [".lrc", ".srt"];
    const maxSizeKB = 100;

    if (
      allowedExtensions.includes(file.name.slice(-4).toLowerCase()) &&
      file.size <= maxSizeKB * 1024
    ) {
      setSelectedLyricsFile(file);
      setUploadState((prevUploadState) => ({
        ...prevUploadState,
        selectedLyrics: file,
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setLyricsPreview(e.target.result);
        setUploadState((prevUploadState) => ({
          ...prevUploadState,
          songDetails: {
            ...prevUploadState.songDetails,
            lyrics: e.target.result, 
          },
        }));
      };
      reader.readAsText(file);
    } else {
      setModalContent({
        title: "Invalid File",
        description: `Please select an ${allowedExtensions.join(
          " or "
        )} file under ${maxSizeKB}KB.`,
      });
      setShowModal(true);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleLyricsSelect(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  return (
    <div className={styles.createUploadContainerInput}>
      <div
        className={styles.createUploadContainerInputLyrics}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={(e) => e.preventDefault()}
      >
        <div className={styles.createUploadContainerInputTitle}>
          <p> Lyrics </p>
        </div>
        <label
          htmlFor="lyricsInput"
          className={styles.createUploadContainerInputInner}
        >
          <input
            type="file"
            id="lyricsInput"
            style={{ display: "none" }}
            onChange={(e) => handleLyricsSelect(e.target.files[0])}
            accept=".lrc, .srt"
          />
          <div className={styles.createUploadContainerInputInnerDrop}>
            <div className={styles.createUploadContainerInputInnerDropIcon}>
              <i className={`fi fi-rr-document`}></i>
            </div>
            <p className={styles.createUploadContainerInputInnerDropText}>
              Drag & Drop Lyrics / Subtitle (.lrc/.srt) or Browse
            </p>
            <p className={styles.createUploadContainerInputInnerDropSupport}>
              Supports: .lrc, .srt (max 100KB)
            </p>
          </div>
        </label>
        {lyricsPreview && (
          <div className={styles.lyricsPreview}>
            <pre>{lyricsPreview}</pre>
          </div>
        )}
      </div>
      {showModal && (
        <HitmakrMiniModal
          title={modalContent.title}
          description={modalContent.description}
          closeButton={<i className="fi fi-br-cross-small"></i>}
          closeFunction={() => setShowModal(false)}
          learnMoreLink={"#"}
          isAction={true}
        />
      )}
    </div>
  );
};

export default LyricsInput;