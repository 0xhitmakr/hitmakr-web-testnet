"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/Settings.module.css";
import Image from "next/image";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import { useAccount } from "wagmi";
import { 
  useUpdateProfileDetails, 
  useSetProfileDetails 
} from "@/app/config/hitmakrprofiledetails/hitmakrProfileDetailsWagmi";
import { 
  useProfileDetailsRPC, 
  useHasProfileDetailsRPC 
} from "@/app/config/hitmakrprofiledetails/hitmakrProfileDetailsRPC";
import tandds from "@/lib/helpers/TandD";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import { useSwitchChain } from "wagmi";
import { skaleChainId } from "@/lib/secure/Config";
import { GetTransactionStatus } from "@/app/helpers/GetTransactionStatus";

export default function ProfileSettingsData() {
  const { address, chainId: wagmiChainId } = useAccount();
  const { details, loading: profileLoading } = useProfileDetailsRPC(address);
  const { hasDetails, loading: hasDetailsLoading } = useHasProfileDetailsRPC(address);
  const { updateProfileDetails, isPending: isUpdatePending, isValidChain, data: updateProfileDetailsData } = useUpdateProfileDetails();
  const { setProfileDetails, isPending: isSetPending, data: setProfileDetailsData } = useSetProfileDetails();
  const { chains, switchChain, isPending: networkSwitching } = useSwitchChain();

  const [profileData, setProfileData] = useState({
    profilePicture: null,
    imageUrl: "",
    fullName: "",
    bio: "",
    dateOfBirth: "",
    country: ""
  });

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    fullName: "",
    bio: "",
    dateOfBirth: "",
    country: ""
  });

  const [uploadLoadingState, setUploadLoadingState] = useState({
    imageUpload: false
  });

  const [transactionHash, setTransactionHash] = useState(null);
  const [isWaitingForTransaction, setIsWaitingForTransaction] = useState(false);
  const [isTransactionSuccess, setIsTransactionSuccess] = useState(false);

  const { txReceiptData, txReceiptLoading, txReceiptSuccess } = GetTransactionStatus(
    transactionHash, 
    wagmiChainId
  );

  const profilePictureInputRef = useRef(null);
  const lastUpdateTimestamp = useRef(0);
  const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000;
  const MINIMUM_AGE = 6;

  useEffect(() => {
    if (details) {
      setProfileData({
        profilePicture: null,
        imageUrl: details.imageURI || "",
        fullName: details.fullName || "",
        bio: details.bio || "",
        dateOfBirth: details.dateOfBirth ? new Date(details.dateOfBirth * 1000).toISOString().split('T')[0] : "",
        country: details.country || ""
      });
      lastUpdateTimestamp.current = details.lastUpdated * 1000;
    }
  }, [details]);

  useEffect(() => {
    if (updateProfileDetailsData || setProfileDetailsData) {
      const txHash = updateProfileDetailsData || setProfileDetailsData;
      setTransactionHash(txHash);
      setIsWaitingForTransaction(true);
      setModalContent({
        title: "Transaction Submitted",
        description: "Please wait while your transaction is being confirmed...",
      });
      setShowModal(true);
    }
  }, [updateProfileDetailsData, setProfileDetailsData]);

  useEffect(() => {
    if (transactionHash && txReceiptData) {
      if (txReceiptData?.status !== "success") {
        setIsWaitingForTransaction(true);
        setIsTransactionSuccess(false);
      } else if (txReceiptData?.status === "success") {
        setIsWaitingForTransaction(false);
        setIsTransactionSuccess(true);
        lastUpdateTimestamp.current = Date.now();
        setModalContent({
          title: "Success",
          description: hasDetails ? "Profile updated successfully!" : "Profile created successfully!",
        });
        setShowModal(true);
        setTransactionHash(null);
      }
    }
  }, [transactionHash, txReceiptData, hasDetails]);

  const validateInput = (name, value) => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (value.length > 100) return "Full name must be less than 100 characters";
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Full name can only contain letters and spaces";
        return "";
      case "bio":
        if (value.length > 500) return "Bio must be less than 500 characters";
        return "";
      case "dateOfBirth":
        if (!hasDetails && !value) return "Date of birth is required for profile creation";
        if (value) {
          const birthDate = new Date(value);
          const today = new Date();
          const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < MINIMUM_AGE) return `Must be at least ${MINIMUM_AGE} years old`;
        }
        return "";
      case "country":
        if (!value.trim()) return "Country is required";
        if (value.length > 56) return "Country name is too long";
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Country can only contain letters and spaces";
        return "";
      default:
        return "";
    }
  };

  const handleImageUpload = async () => {
    if (!profileData.profilePicture) return;

    setUploadLoadingState(prev => ({ ...prev, imageUpload: true }));
    const formData = new FormData();
    formData.append("profilePicture", profileData.profilePicture);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/user/profile-dp-url-generator`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Image upload failed");

      const data = await response.json();
      setProfileData(prev => ({
        ...prev,
        imageUrl: data.profilePictureUrl,
        profilePicture: null
      }));

      setModalContent({
        title: "Success",
        description: "Profile picture uploaded successfully!"
      });
      setShowModal(true);
    } catch (error) {
      setModalContent({
        title: "Error",
        description: "Failed to upload profile picture. Please try again."
      });
      setShowModal(true);
    } finally {
      setUploadLoadingState(prev => ({ ...prev, imageUpload: false }));
    }
  };

  const handleImageSelect = (file, imageType) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 1 * 1024 * 1024;

    if (!file) {
      setModalContent({
        title: "Error",
        description: "Please select a file.",
      });
      setShowModal(true);
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setModalContent({
        title: "Invalid File Type",
        description: "Please select a JPG, PNG, or GIF image.",
      });
      setShowModal(true);
      return;
    }

    if (file.size > maxSize) {
      setModalContent({
        title: "File Too Large",
        description: "Image must be under 1MB.",
      });
      setShowModal(true);
      return;
    }

    setProfileData(prev => ({
      ...prev,
      [imageType]: file,
    }));
  };

  const handleDrop = (event, imageType) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) handleImageSelect(file, imageType);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    const error = validateInput(name, value);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkCooldown = () => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimestamp.current;
    return timeSinceLastUpdate >= COOLDOWN_PERIOD;
  };

  const handleSubmit = async () => {
    if (!hasDetails) {
      if (!profileData.fullName || !profileData.dateOfBirth || !profileData.country) {
        setModalContent({
          title: "Missing Required Fields",
          description: "Full name, date of birth, and country are required for profile creation.",
        });
        setShowModal(true);
        return;
      }
    } else if (!checkCooldown()) {
      const timeRemaining = Math.ceil((COOLDOWN_PERIOD - (Date.now() - lastUpdateTimestamp.current)) / (1000 * 60 * 60));
      setModalContent({
        title: "Cooldown Period",
        description: `Please wait ${timeRemaining} hours before updating your profile again.`,
      });
      setShowModal(true);
      return;
    }

    const errors = {
      fullName: validateInput("fullName", profileData.fullName),
      bio: validateInput("bio", profileData.bio),
      dateOfBirth: validateInput("dateOfBirth", profileData.dateOfBirth),
      country: validateInput("country", profileData.country)
    };

    setValidationErrors(errors);

    if (Object.values(errors).some(error => error)) {
      setModalContent({
        title: "Validation Error",
        description: "Please fix all errors before submitting.",
      });
      setShowModal(true);
      return;
    }

    if (!isValidChain) {
      setModalContent({
        title: "Wrong Network",
        description: "Please switch to the Skale network to proceed.",
      });
      setShowModal(true);
      return;
    }

    try {
      setIsWaitingForTransaction(true);
      setIsTransactionSuccess(false);
      
      if (!hasDetails) {
        const dobTimestamp = Math.floor(new Date(profileData.dateOfBirth).getTime() / 1000);
        await setProfileDetails(
          profileData.fullName,
          profileData.imageUrl,
          profileData.bio || "",
          dobTimestamp,
          profileData.country
        );
      } else {
        await updateProfileDetails(
          profileData.fullName,
          profileData.imageUrl,
          profileData.bio || "",
          profileData.country
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setModalContent({
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
      setShowModal(true);
      setIsWaitingForTransaction(false);
      setIsTransactionSuccess(false);
    }
  };

  const hasChanges = details && (
    profileData.fullName !== details.fullName ||
    profileData.bio !== details.bio ||
    profileData.country !== details.country ||
    profileData.imageUrl !== details.imageURI
  );

  const isFormSubmitting = isUpdatePending || isSetPending || txReceiptLoading || isWaitingForTransaction;

  if (profileLoading || hasDetailsLoading) {
    return <div className={styles.profileSettingsLoading}><LoaderWhiteSmall /></div>;
  }

  return (
    <div className={styles.hitmakrForm}>
      <div className={styles.hitmakrFormContainer}>
        <div>
          <div className={styles.formDetails}>
            <label htmlFor="profilePicture" className={styles.formDetailsLabel}>
              Profile Picture:
            </label>
            <div
              className={styles.createUploadContainerInputImage}
              onDrop={(e) => handleDrop(e, "profilePicture")}
              onDragOver={handleDragOver}
              onClick={() => profilePictureInputRef.current.click()}
            >
              <input
                type="file"
                id="profilePicture"
                ref={profilePictureInputRef}
                style={{ display: "none" }}
                onChange={(e) => handleImageSelect(e.target.files[0], "profilePicture")}
                accept=".jpg, .png, .gif"
              />

              <div className={styles.imageContainer}>
                {(profileData.profilePicture || profileData.imageUrl || details?.imageURI) && (
                  <Image
                    src={
                      profileData.profilePicture 
                        ? URL.createObjectURL(profileData.profilePicture)
                        : profileData.imageUrl || details?.imageURI
                    }
                    alt="Profile Picture"
                    width={300}
                    height={300}
                    style={{ objectFit: "cover", borderRadius: "10px" }}
                    priority
                  />
                )}
                
                <div className={styles.imageOverlay}>
                  <i className="fi fi-rr-picture" />
                  <p>Drag & Drop or Click to Change</p>
                  <small>1MB MAX (400 x 400)</small>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formDetailsSave}>
            {profileData.profilePicture && (
              <div className="mt-4">
                <HitmakrButton
                  buttonWidth="100px"
                  buttonFunction={handleImageUpload}
                  buttonName="Save"
                  isLoading={uploadLoadingState.imageUpload}
                />
              </div>
            )}
          </div>

          <div className={styles.formDetails}>
            <label htmlFor="fullName" className={styles.formDetailsLabel}>
              Full Name: {!hasDetails && <span className={styles.required}>*</span>}
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={profileData.fullName}
              onChange={handleChange}
              className={styles.formDetailsInput}
            />
            {validationErrors.fullName && (
              <span className={styles.errorText}>{validationErrors.fullName}</span>
            )}
          </div>

          {!hasDetails && (
            <div className={styles.formDetails}>
              <label htmlFor="dateOfBirth" className={styles.formDetailsLabel}>
                Date of Birth: <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={profileData.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={styles.formDetailsInput}
              />
              {validationErrors.dateOfBirth && (
                <span className={styles.errorText}>{validationErrors.dateOfBirth}</span>
              )}
            </div>
          )}

          <div className={styles.formDetails}>
            <label htmlFor="bio" className={styles.formDetailsLabel}>
              Bio:
            </label>
            <textarea
              id="bio"
              name="bio"
              value={profileData.bio}
              onChange={handleChange}
              className={styles.formDetailsInput}
            />
            {validationErrors.bio && (
              <span className={styles.errorText}>{validationErrors.bio}</span>
            )}
          </div>

          <div className={styles.formDetails}>
            <label htmlFor="country" className={styles.formDetailsLabel}>
              Place: {!hasDetails && <span className={styles.required}>*</span>}
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={profileData.country}
              onChange={handleChange}
              className={styles.formDetailsInput}
            />
            {validationErrors.country && (
              <span className={styles.errorText}>{validationErrors.country}</span>
            )}
          </div>

          {hasDetails && (
            <div className={styles.formDetails}>
              <label className={styles.formDetailsLabel}>
                <p>
                  Get ready for the ultimate thrill ride 🚀! Users now have the chance to refresh their profiles once every <span>24 hours</span>. It's like we're handing out superpowers, but with a 24-hour cooldown. Buckle up, because your digital self is about to get a major upgrade!
                </p>
              </label>
            </div>
          )}

          <div className={styles.submitButton}>
            <HitmakrButton
              buttonWidth="50%"
              buttonFunction={handleSubmit}
              buttonName={hasDetails ? "Update Profile" : "Create Profile"}
              isDark={hasDetails && !hasChanges}
              isLoading={isFormSubmitting}
            />
          </div>
        </div>
      </div>

      {!isValidChain && (
        <HitmakrMiniModal
          title={tandds.switchNetworkToProfileUpdateTitle}
          description={tandds.switchNetworkToProfileUpdateDescription}
          closeButton={<i className="fi fi-br-cross-small"></i>}
          closeFunction={() => setShowModal(false)}
          isAction={true}
          actionButton={
            <HitmakrButton 
              buttonFunction={() => switchChain({ chainId: skaleChainId })} 
              isLoading={networkSwitching} 
              isDark={false} 
              buttonName={"Change Network"} 
              buttonWidth={"75%"}
            />
          }
        />
      )}

      {showModal && (
        <HitmakrMiniModal
          title={modalContent.title}
          description={modalContent.description}
          closeButton={<i className="fi fi-br-cross-small"></i>}
          closeFunction={() => setShowModal(false)}
          isAction={true}
        />
      )}
    </div>
  );
}