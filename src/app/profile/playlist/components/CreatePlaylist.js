"use client"

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import styles from "../styles/Playlist.module.css";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import '@flaticon/flaticon-uicons/css/all/all.css';
import RouterPushLink from "@/app/helpers/RouterPushLink";

const PLAYLIST_NAME_MAX_LENGTH = 50;
const PLAYLIST_DESCRIPTION_MAX_LENGTH = 350;

export default function CreatePlaylist() {
  const { address, chainId: wagmiChainId } = useAccount();

  const [playlistData, setPlaylistData] = useState({
    imageFile: null,
    imageUrl: "",
    name: "",
    description: "",
  });
  
  const [isModified, setIsModified] = useState({
    image: false,
    name: false,
    description: false
  });

  const [isLoading, setIsLoading] = useState({
    imageUpload: false,
    playlistCreate: false
  });
  
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", description: "" });
  
  const playlistImageInputRef = useRef(null);
  const {routeTo} = RouterPushLink();

  const validateImage = (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 1 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Please select a JPG, PNG, or GIF image.");
    }
    if (file.size > maxSize) {
      throw new Error("Image size should be under 1MB.");
    }
    return true;
  };

  const handleImageSelect = (file) => {
    try {
      if (file && validateImage(file)) {
        setPlaylistData(prev => ({
          ...prev,
          imageFile: file
        }));
        setIsModified(prev => ({ ...prev, image: true }));
      }
    } catch (error) {
      setModalContent({
        title: "Invalid File",
        description: error.message
      });
      setShowModal(true);
    }
  };

  const handleImageUpload = async () => {
    if (!playlistData.imageFile) return;

    setIsLoading(prev => ({ ...prev, imageUpload: true }));
    const formData = new FormData();
    formData.append("profilePicture", playlistData.imageFile); // Using the same field name as profile upload
    const authToken = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/user/profile-dp-url-generator`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      setPlaylistData(prev => ({
        ...prev,
        imageUrl: data.profilePictureUrl,
        imageFile: null
      }));
      setIsModified(prev => ({ ...prev, image: true }));

      setModalContent({
        title: "Success",
        description: "Playlist image uploaded successfully!"
      });
      setShowModal(true);
    } catch (error) {
      setModalContent({
        title: "Error",
        description: "Failed to upload playlist image. Please try again."
      });
      setShowModal(true);
    } finally {
      setIsLoading(prev => ({ ...prev, imageUpload: false }));
    }
  };

  

  const sanitizeString = (str) => {
    if (!str) return '';
    return str
      .replace(/[\n\r]/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/"/g, '\\"')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      .trim();
  };
  
  const handleChange = (event) => {
    const { name, value } = event.target;
    let updatedValue = value;
  
    if (name === "name" && value.length > PLAYLIST_NAME_MAX_LENGTH) {
      updatedValue = value.slice(0, PLAYLIST_NAME_MAX_LENGTH);
    } else if (name === "description" && value.length > PLAYLIST_DESCRIPTION_MAX_LENGTH) {
      updatedValue = value.slice(0, PLAYLIST_DESCRIPTION_MAX_LENGTH);
    }
  
    setPlaylistData(prev => ({ ...prev, [name]: updatedValue }));
    setIsModified(prev => ({ ...prev, [name]: true }));
  };
  
  const handleCreatePlaylist = async () => {
    if (!playlistData.name || !playlistData.imageUrl) {
      setModalContent({
        title: "Missing Information",
        description: "Please provide a playlist name and image."
      });
      setShowModal(true);
      return;
    }

    setIsLoading(prev => ({ ...prev, playlistCreate: true }));
    const authToken = localStorage.getItem("authToken");

    try {
      const playlistParams = {
        name: sanitizeString(playlistData.name),
        description: sanitizeString(playlistData.description),
        imageUrl: playlistData.imageUrl,
        isPublic: true 
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
          body: JSON.stringify(playlistParams),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create playlist");
      }

      const data = await response.json();
      
      setPlaylistData({
        imageFile: null,
        imageUrl: "",
        name: "",
        description: "",
      });
      setIsModified({
        image: false,
        name: false,
        description: false
      });

      // Show success message
      setModalContent({
        title: "Success",
        description: "Playlist created successfully!"
      });

      routeTo(`/playlist/${data.playlist.playlistId}`)

    } catch (error) {
      console.error("Error creating playlist:", error);
      setModalContent({
        title: "Error",
        description: error.message || "Failed to create playlist. Please try again."
      });
    } finally {
      setIsLoading(prev => ({ ...prev, playlistCreate: false }));
      setShowModal(true);
    }
  };

  const isFormModified = Object.values(isModified).some(value => value);

  return (
    <div className={styles.hitmakrForm}>
      <div className={styles.hitmakrFormContainer}>
        <div>
          <div className={styles.formDetails}>
            <label htmlFor="playlistImage" className={styles.formDetailsLabel}>
              Playlist Cover
            </label>
            <div 
              className={styles.createUploadContainerInputImage}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleImageSelect(file);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
            >
              <input
                type="file"
                id="playlistImage"
                ref={playlistImageInputRef}
                style={{ display: "none" }}
                onChange={(e) => handleImageSelect(e.target.files[0])}
                accept=".jpg, .png, .gif"
              />

              <div className={styles.imageContainer}>
                {(playlistData.imageFile || playlistData.imageUrl) && (
                  <Image
                    src={playlistData.imageFile ? URL.createObjectURL(playlistData.imageFile) : playlistData.imageUrl}
                    alt="Playlist Cover"
                    width={300}
                    height={300}
                    style={{ objectFit: "cover", borderRadius: "10px" }}
                    priority
                  />
                )}
                
                <div 
                  className={styles.imageOverlay}
                  onClick={() => playlistImageInputRef.current.click()}
                >
                  <i className="fi fi-rr-picture" />
                  <p>Drag & Drop or Click to Change</p>
                  <small>1MB MAX (400 x 400)</small>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formDetailsSave}>
            {playlistData.imageFile && (
              <div className="mt-4">
                <HitmakrButton
                  buttonWidth="100px"
                  buttonFunction={handleImageUpload}
                  buttonName="Save"
                  isLoading={isLoading.imageUpload}
                />
              </div>
            )}
          </div>

          <div className={styles.formDetails}>
            <label htmlFor="name" className={styles.formDetailsLabel}>
              Playlist Name <small className={styles.inputLimit}>{playlistData.name.length}/{PLAYLIST_NAME_MAX_LENGTH}</small>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={playlistData.name}
              onChange={handleChange}
              className={styles.formDetailsInput}
              maxLength={PLAYLIST_NAME_MAX_LENGTH}
              placeholder="Give your playlist a name"
            />
          </div>

          <div className={styles.formDetails}>
            <label htmlFor="description" className={styles.formDetailsLabel}>
              Description <small className={styles.inputLimit}>{playlistData.description.length}/{PLAYLIST_DESCRIPTION_MAX_LENGTH}</small>
            </label>
            <textarea
              id="description"
              name="description"
              value={playlistData.description}
              onChange={handleChange}
              className={styles.formDetailsInput}
              maxLength={PLAYLIST_DESCRIPTION_MAX_LENGTH}
              placeholder="Describe your playlist"
            />
          </div>

          <div className={styles.submitButton}>
            <HitmakrButton
              buttonWidth="50%"
              buttonFunction={handleCreatePlaylist}
              buttonName="Create Playlist"
              isDark={!isFormModified}
              isLoading={isLoading.playlistCreate}
            />
          </div>
        </div>
        <div className="margin50vh"></div>
      </div>

      {showModal && (
        <HitmakrMiniModal
          title={modalContent.title}
          description={modalContent.description}
          closeButton={<i className="fi fi-br-cross-small" />}
          closeFunction={() => setShowModal(false)}
          isAction={true}
        />
      )}
    </div>
  );
}