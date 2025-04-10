"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import styles from "../styles/Collection.module.css";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import "@flaticon/flaticon-uicons/css/all/all.css";
import RouterPushLink from "@/app/helpers/RouterPushLink";

const COLLECTION_NAME_MAX_LENGTH = 50;
const COLLECTION_DESCRIPTION_MAX_LENGTH = 350;

export default function CreateCollection() {
  const { address, chainId: wagmiChainId } = useAccount();

  const [collectionData, setCollectionData] = useState({
    imageFile: null,
    imageUrl: "",
    name: "",
    description: "",
    type: "album", // Default value
  });

  const [isModified, setIsModified] = useState({
    image: false,
    name: false,
    description: false,
    type: false,
  });

  const [isLoading, setIsLoading] = useState({
    imageUpload: false,
    collectionCreate: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });

  const collectionImageInputRef = useRef(null);
  const { routeTo } = RouterPushLink();

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
        setCollectionData((prev) => ({
          ...prev,
          imageFile: file,
        }));
        setIsModified((prev) => ({ ...prev, image: true }));
      }
    } catch (error) {
      setModalContent({
        title: "Invalid File",
        description: error.message,
      });
      setShowModal(true);
    }
  };

  const handleImageUpload = async () => {
    if (!collectionData.imageFile) return;

    setIsLoading((prev) => ({ ...prev, imageUpload: true }));
    const formData = new FormData();
    formData.append("profilePicture", collectionData.imageFile); // Using the same field name as profile upload
    const authToken = localStorage.getItem("@appkit/siwx-auth-token");
    const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");
    console.log(authToken, nonceToken);
    try {
      if (!authToken || !nonceToken) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/user/profile-dp-url-generator`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-nonce-token": nonceToken,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      setCollectionData((prev) => ({
        ...prev,
        imageUrl: data.profilePictureUrl,
        imageFile: null,
      }));
      setIsModified((prev) => ({ ...prev, image: true }));

      setModalContent({
        title: "Success",
        description: "Collection image uploaded successfully!",
      });
      setShowModal(true);
    } catch (error) {
      setModalContent({
        title: "Error",
        description: "Failed to upload collection image. Please try again.",
      });
      setShowModal(true);
    } finally {
      setIsLoading((prev) => ({ ...prev, imageUpload: false }));
    }
  };

  const sanitizeString = (str) => {
    if (!str) return "";
    return str
      .replace(/[\n\r]/g, " ")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .replace(/"/g, '\\"')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      .trim();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    let updatedValue = value;

    if (name === "name" && value.length > COLLECTION_NAME_MAX_LENGTH) {
      updatedValue = value.slice(0, COLLECTION_NAME_MAX_LENGTH);
    } else if (
      name === "description" &&
      value.length > COLLECTION_DESCRIPTION_MAX_LENGTH
    ) {
      updatedValue = value.slice(0, COLLECTION_DESCRIPTION_MAX_LENGTH);
    }

    setCollectionData((prev) => ({ ...prev, [name]: updatedValue }));
    setIsModified((prev) => ({ ...prev, [name]: true }));
  };

  const handleCreateCollection = async () => {
    if (!collectionData.name || !collectionData.imageUrl) {
      setModalContent({
        title: "Missing Information",
        description: "Please provide a collection name and image.",
      });
      setShowModal(true);
      return;
    }

    setIsLoading((prev) => ({ ...prev, collectionCreate: true }));
    const authToken = localStorage.getItem("@appkit/siwx-auth-token");
    const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");

    try {
      if (!authToken || !nonceToken) {
        throw new Error("Authentication token not found");
      }

      const collectionParams = {
        name: sanitizeString(collectionData.name),
        description: sanitizeString(collectionData.description),
        imageUrl: collectionData.imageUrl,
        type: collectionData.type,
        isPublic: true,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/collections`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "x-nonce-token": nonceToken,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
          credentials: "include",
          body: JSON.stringify(collectionParams),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create collection");
      }

      const data = await response.json();

      setCollectionData({
        imageFile: null,
        imageUrl: "",
        name: "",
        description: "",
        type: "album",
      });
      setIsModified({
        image: false,
        name: false,
        description: false,
        type: false,
      });

      // Show success message
      setModalContent({
        title: "Success",
        description: "Collection created successfully!",
      });

      routeTo(`/collection/${data.collection.collectionId}`);
    } catch (error) {
      console.error("Error creating collection:", error);
      setModalContent({
        title: "Error",
        description:
          error.message || "Failed to create collection. Please try again.",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, collectionCreate: false }));
      setShowModal(true);
    }
  };

  const isFormModified = Object.values(isModified).some((value) => value);

  return (
    <div className={styles.hitmakrForm}>
      <div className={styles.hitmakrFormContainer}>
        <div>
          <div className={styles.formDetails}>
            <label
              htmlFor="collectionImage"
              className={styles.formDetailsLabel}
            >
              Collection Cover
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
                id="collectionImage"
                ref={collectionImageInputRef}
                style={{ display: "none" }}
                onChange={(e) => handleImageSelect(e.target.files[0])}
                accept=".jpg, .png, .gif"
              />

              <div className={styles.imageContainer}>
                {(collectionData.imageFile || collectionData.imageUrl) && (
                  <Image
                    src={
                      collectionData.imageFile
                        ? URL.createObjectURL(collectionData.imageFile)
                        : collectionData.imageUrl
                    }
                    alt="Collection Cover"
                    width={300}
                    height={300}
                    style={{ objectFit: "cover", borderRadius: "10px" }}
                    priority
                  />
                )}

                <div
                  className={styles.imageOverlay}
                  onClick={() => collectionImageInputRef.current.click()}
                >
                  <i className="fi fi-rr-picture" />
                  <p>Drag & Drop or Click to Change</p>
                  <small>1MB MAX (400 x 400)</small>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formDetailsSave}>
            {collectionData.imageFile && (
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
              Collection Name{" "}
              <small className={styles.inputLimit}>
                {collectionData.name.length}/{COLLECTION_NAME_MAX_LENGTH}
              </small>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={collectionData.name}
              onChange={handleChange}
              className={styles.formDetailsInput}
              maxLength={COLLECTION_NAME_MAX_LENGTH}
              placeholder="Give your collection a name"
            />
          </div>

          <div className={styles.formDetails}>
            <label htmlFor="type" className={styles.formDetailsLabel}>
              Collection Type
            </label>
            <select
              id="type"
              name="type"
              value={collectionData.type}
              onChange={handleChange}
              className={styles.formDetailsInput}
            >
              <option value="album">Album</option>
              <option value="mixtape">Mixtape</option>
              <option value="pack">Pack</option>
            </select>
          </div>

          <div className={styles.formDetails}>
            <label htmlFor="description" className={styles.formDetailsLabel}>
              Description{" "}
              <small className={styles.inputLimit}>
                {collectionData.description.length}/
                {COLLECTION_DESCRIPTION_MAX_LENGTH}
              </small>
            </label>
            <textarea
              id="description"
              name="description"
              value={collectionData.description}
              onChange={handleChange}
              className={styles.formDetailsInput}
              maxLength={COLLECTION_DESCRIPTION_MAX_LENGTH}
              placeholder="Describe your collection"
            />
          </div>

          <div className={styles.submitButton}>
            <HitmakrButton
              buttonWidth="50%"
              buttonFunction={handleCreateCollection}
              buttonName="Create Collection"
              isDark={!isFormModified}
              isLoading={isLoading.collectionCreate}
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
