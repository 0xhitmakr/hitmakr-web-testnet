"use client";

import React, { useState } from "react";
import styles from "../../styles/Create.module.css";
import Image from "next/image";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";

const ArtworkInput = () => {
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const { selectedCover } = uploadState;
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", description: "" });

  const handleCoverSelect = (file) => {
    const allowedCoverTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (allowedCoverTypes.includes(file.type) && file.size <= maxSize) {
      setUploadState({
        ...uploadState,
        selectedCover: file,
      });
    } else {
      setModalContent({
        title: "Invalid File",
        description: `Please select a JPG, PNG, or GIF image under ${
          maxSize / (1024 * 1024)
        }MB.`,
      });
      setShowModal(true);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleCoverSelect(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  return (
    <div className={styles.createUploadContainerInput}>
      <div
        className={styles.createUploadContainerInputCover}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={(e) => e.preventDefault()}
      >
        <div className={styles.createUploadContainerInputTitle}>
          <p> Song Artwork * </p>
          <span>
            <p>
              {" "}
              Size: 800 x 800px <br></br> Maximum file size: 10MB (.jpg, .png,
              .gif) <br></br> This artwork will be displayed on your song page
              as the Limited Edition cover.{" "}
            </p>
          </span>
        </div>
        <label
          htmlFor="coverInput"
          className={styles.createUploadContainerInputImage}
        >
          <input
            type="file"
            id="coverInput"
            style={{ display: "none" }}
            onChange={(e) => handleCoverSelect(e.target.files[0])}
            accept=".jpg, .png, .gif"
          />
          {selectedCover ? (
            <Image
              src={URL.createObjectURL(selectedCover)}
              alt="Selected Cover"
              width={300}
              height={300}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className={styles.placeholderImage}>
              <i className={`fi fi-rr-picture`}></i>
              <p>Drag & Drop or Browse</p>
            </div>
          )}
        </label>
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

export default ArtworkInput;