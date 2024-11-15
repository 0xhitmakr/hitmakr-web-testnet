"use client"

import React, { useState } from "react";
import { useRecoilState } from "recoil";
import { useAccount } from 'wagmi';
import { useSIWE } from 'connectkit';
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import styles from "../../styles/Create.module.css";
import HitmakrMiniAudioPlayer from "@/app/components/musicplayers/miniplayer/HitmakrMiniAudioPlayer";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";

const AudioInput = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const { address, chainId } = useAccount();
  const { isSignedIn } = useSIWE();
  const allowedFileTypes = ["audio/mpeg", "audio/wav", "audio/flac"];
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", description: "" });

  const copyrightChecked = uploadState?.copyrightChecked || false;

  const handleVerificationResultState = () => {
    setUploadState((prevUploadState) => ({
      ...prevUploadState,
      copyrightChecked: !prevUploadState.copyrightChecked, 
    }));
  };

  const handleVerify = async (file) => {
    if (!file) {
      setModalContent({
        title: "File Missing",
        description: "Please select a file first."
      });
      setShowModal(true);
      return;
    }

    if (!address || !isSignedIn || !chainId) {
      setModalContent({
        title: "Wallet Not Connected",
        description: "Please connect your wallet and sign in."
      });
      setShowModal(true);
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('song', file);

      const authToken = localStorage.getItem('authToken');

      const response = await fetch(`${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/copyright/copyright-check`, {
        method: 'POST',
        credentials: 'include',  
        body: formData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-user-address': address, 
          'x-chain-id': chainId.toString(),  
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setUploadState((prevUploadState) => ({
        ...prevUploadState,
        copyrightChecked: result.message === 'No copyright violation detected.',
      }));

      console.log(result.message)

      if (result.message === 'Copyright violation detected.') {
        setVerificationResult({
          type: 'violation',
          title: result.song.title,
          artist: result.song.artist
        });
      } else if (result.message === 'Potential copyright issue: Fingerprint match found.') {
        setVerificationResult({
          type: 'fingerprint',
          matchPercentage: result.matchPercentage
        });
      } else if (result.message === 'No copyright violation detected.') {
        setVerificationResult({ type: 'clear' });
      } else {
        setVerificationResult({ type: 'error' });
      }
    } catch (error) {
      console.error('Error verifying copyright:', error);
      setVerificationResult({ type: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (allowedFileTypes.includes(file.type)) {
      setUploadState((prevUploadState) => ({ 
        ...prevUploadState,
        selectedFile: file,
      }));
      setSelectedFile(file);
      setVerificationResult(null);
      handleVerify(file); 
    } else {
      setModalContent({
        title: "Invalid File Type",
        description: "Please select an MP3, WAV, or FLAC file."
      });
      setShowModal(true);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];

    if (allowedFileTypes.includes(file.type)) {
      setUploadState((prevUploadState) => ({ 
        ...prevUploadState,
        selectedFile: file,
      }));
      setSelectedFile(file);
      setVerificationResult(null);
      handleVerify(file);
    } else {
      setModalContent({
        title: "Invalid File Type",
        description: "Please select an MP3, WAV, or FLAC file."
      });
      setShowModal(true);
    }
  };

  return (
    <div>
      
      <div className={styles.createUploadContainerInput}>
        <label
          htmlFor="fileInput"
          className={styles.createUploadContainerInputInner}
          onDrop={handleFileDrop}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={(event) => event.preventDefault()}
        >
          <input
            type="file"
            id="fileInput"
            style={{ display: "none" }}
            onChange={handleFileSelect}
            accept=".mp3, .wav, .flac"
          />
          <div className={styles.createUploadContainerInputInnerDrop}>
            <div className={styles.createUploadContainerInputInnerDropIcon}>
              <i className={`fi fi-rr-music`}></i>
            </div>
            <p className={styles.createUploadContainerInputInnerDropText}>
              Drag & Drop <br /> or <span style={{ color: "#fff" }}>browse</span>
            </p>
            <p className={styles.createUploadContainerInputInnerDropSupport}>
              Supports: MP3, WAV, FLAC (max 100MB)
            </p>
          </div>
        </label>
      </div>
      {selectedFile && (
        <div className={styles.createUploadContainerInput}>
          <div className={styles.audioPlayer}>
            <HitmakrMiniAudioPlayer selectedFile={selectedFile} />
          </div>
        </div>
      )}
      {isVerifying && (
        <div className={styles.createUploadContainerInput}>
          <div className={styles.verificationResult}>
            <LoaderWhiteSmall />
          </div>
        </div>
      )}
      {verificationResult && (
        <div className={styles.createUploadContainerInput}>
          <div className={styles.verificationResult}>
            {verificationResult.type === 'violation' && (
              <>
                <p>
                  Copyright violation detected<br />
                  <br />
                  Song: {verificationResult.title}<br />
                  Artist: {verificationResult.artist}
                </p>
                <div className={styles.copyrightOverwrite}>
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={copyrightChecked}
                      onChange={handleVerificationResultState}
                    />
                    <span className={styles.checkmark}></span>
                    I hereby confirm that I fully own the rights to this release or possess the necessary permissions. I also accept the terms and conditions set forth by Hitmakr.
                  </label>
                </div>
              </>
            )}
            {verificationResult.type === 'fingerprint' && (
              <>
                <p>
                  Potential copyright match detected<br />
                  <br />
                  Match percentage: {verificationResult.matchPercentage}%
                </p>
                <div className={styles.copyrightOverwrite}>
                  <label className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      checked={copyrightChecked}
                      onChange={handleVerificationResultState}
                    />
                    <span className={styles.checkmark}></span>
                    I hereby confirm that I fully own the rights to this release or possess the necessary permissions. I also accept the terms and conditions set forth by Hitmakr.
                  </label>
                </div>
              </>
            )}
            {verificationResult.type === 'clear' && (
              <p>
                No copyright violations detected.<br />
                Song is ready to use!
              </p>
            )}
            {verificationResult.type === 'error' && (
              <p>
                An error occurred during verification. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
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

export default AudioInput;