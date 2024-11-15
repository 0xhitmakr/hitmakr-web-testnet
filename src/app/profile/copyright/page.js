"use client";

import React, { useState } from "react";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import styles from "./styles/Copyright.module.css";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import { useAccount } from "wagmi";

const MAX_CLAIM_LENGTH = 1000;

export default function CopyrightClaimPage() {
  const [dsrcId, setDsrcId] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [email, setEmail] = useState("");
  const [referenceLink, setReferenceLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });
  const { address, chainId } = useAccount();

  const allDataSet = dsrcId && claimDescription && email && referenceLink;

  const handleChangeClaimDescription = (e) => {
    let value = e.target.value;
    if (value.length > MAX_CLAIM_LENGTH) {
      value = value.slice(0, MAX_CLAIM_LENGTH);
    }
    setClaimDescription(value);
  };

  const handleChangeDsrcId = (e) => setDsrcId(e.target.value);
  const handleChangeEmail = (e) => setEmail(e.target.value);
  const handleChangeReferenceLink = (e) => setReferenceLink(e.target.value);

  const handleSubmitClaim = async () => {
    const authToken = localStorage.getItem("authToken");

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/dsrc-copyright/claim`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "x-user-address": address,
            "x-chain-id": chainId.toString(),
          },
          body: JSON.stringify({ dsrcId, claimDescription, email, referenceLink }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setModalContent({
        title: "Success",
        description: data.message,
      });
    } catch (error) {
      console.error("Error submitting claim:", error);
      setModalContent({
        title: "Error",
        description: "Failed to submit claim. Please try again later.",
      });
    } finally {
      setIsLoading(false);
      setShowModal(true);
    }
  };

  return (
    <>
      <div className={styles.copyright}>
        <div className={styles.copyrightHeader}>
          <p>Copyright</p>
        </div>
        <div className={styles.copyrightContainer}>
          <div className={styles.formDetails}>
            <label htmlFor="dsrcId" className={styles.formDetailsLabel}>
              DSRC id
            </label>
            <input
              type="text"
              id="dsrcId"
              name="dsrcId"
              value={dsrcId}
              onChange={handleChangeDsrcId}
              className={styles.formDetailsInput}
              placeholder="USHTMKR2400001"
            />
          </div>
          <div className={styles.formDetails}>
            <label htmlFor="claimDescription" className={styles.formDetailsLabel}>
              Claim Description <small className={styles.inputLimit}>{claimDescription.length}/{MAX_CLAIM_LENGTH}</small>
            </label>
            <textarea
              id="claimDescription"
              name="claimDescription"
              value={claimDescription}
              onChange={handleChangeClaimDescription}
              className={styles.formDetailsInput}
              maxLength={MAX_CLAIM_LENGTH}
              placeholder="What exactly you want to cliam?"
            />
          </div>
          <div className={styles.formDetails}>
            <label htmlFor="email" className={styles.formDetailsLabel}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChangeEmail}
              className={styles.formDetailsInput}
              placeholder="ogcreator@hitmakr.io"
            />
          </div>
          <div className={styles.formDetails}>
            <label htmlFor="referenceLink" className={styles.formDetailsLabel}>
              Reference Link
            </label>
            <input
              type="url"
              id="referenceLink"
              name="referenceLink"
              value={referenceLink}
              onChange={handleChangeReferenceLink}
              className={styles.formDetailsInput}
              placeholder="https://youtu.be/GFGPSx6cPN0"
            />
          </div>
          <div className={styles.formDetails}>
              <label className={styles.formDetailsLabel}>
                  <p>
                  Ready to secure your digital creations? 🪗 Users now have the opportunity to make a copyright claim. It’s like gaining a superpower to <span>protect your content</span>, with just a one-hour cooldown. Claim what's yours and keep your creations safe!
                  </p>
              </label>
          </div>
          <div className={styles.submitButton}>
            <HitmakrButton
              buttonWidth="50%"
              buttonFunction={handleSubmitClaim}
              buttonName="Submit Claim"
              isDark={!allDataSet}
              isLoading={isLoading}
              
            />
          </div>
        </div>
      </div>
      {showModal && (
        <HitmakrMiniModal
          title={modalContent.title}
          description={modalContent.description}
          closeButton={<i className="fi fi-br-cross-small"></i>}
          closeFunction={() => setShowModal(false)}
          isAction={true}
        />
      )}
    </>
  );
}
