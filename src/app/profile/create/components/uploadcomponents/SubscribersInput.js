"use client";

import React, { useState } from "react"; 
import styles from "../../styles/Create.module.css";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";
import CategoryInput from "./CategoryInput";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal"; 

const SubscribersInput = () => {
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const subscribersUpload = uploadState?.subscribersUpload || false;

  const [showModal, setShowModal] = useState(false);

  const handleSubscriberChange = () => {

    setUploadState({
      ...uploadState,
      subscribersUpload: false,
    });

    if (!subscribersUpload) {
      setShowModal(true); 
    }
  };

  return (
    <div className={styles.createUploadContainerInput}>
      <div className={styles.createUploadContainerInputName}>
        <p>Subscribers</p>
        <div className={styles.createUploadContainerInputButton}>
          <input
            type="checkbox"
            checked={subscribersUpload}
            onChange={handleSubscriberChange}
            id="switch"
          />
          <label htmlFor="switch">Toggle</label>
        </div>
      </div>
      <CategoryInput />

      {showModal && (
        <HitmakrMiniModal 
          title="Upcoming Feature: Gated Uploads"
          description="Gated uploads will be live on testnet by the end of this year."
          closeButton={<i className="fi fi-br-cross-small"></i>} 
          closeFunction={() => setShowModal(false)}
          isAction={true} 
        />
      )}
    </div>
  );
};

export default SubscribersInput;