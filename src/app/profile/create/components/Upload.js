"use client";

import React,{useState} from "react";
import styles from "../styles/Create.module.css";
import '@flaticon/flaticon-uicons/css/all/all.css';
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import { useRecoilState } from "recoil";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import AudioInput from "./uploadcomponents/AudioInput";
import LyricsInput from "./uploadcomponents/LyricsInput";
import ArtworkInput from "./uploadcomponents/ArtWorkInput";
import DetailsInput from "./uploadcomponents/DetailsInput";
import MintPrice from "./uploadcomponents/MintPrice";
import RoyaltySplitsInput from "./uploadcomponents/RoyaltySplitsInput";
import UploadButton from "./uploadcomponents/UploadButton";
import CategoryInput from "./uploadcomponents/CategoryInput";
import ChainSelect from "./uploadcomponents/ChainSelect";


export default function Upload() {
  const [showModal, setShowModal] = useState(false);
  const allowedFileTypes = ["audio/mpeg", "audio/wav", "audio/flac"];
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );

  return (
    <>
      <div className={styles.createUpload}>
        <div className={styles.createUploadContainer}>
          <div className={styles.createUploadContainerInputs}>
              <div className={styles.initialSelect}>
                <div className={styles.initialSelectLeft}>
                  <ChainSelect />
                </div>
                <div className={styles.initialSelectRight}>
                  <CategoryInput />
                </div>
              </div>
              
              <AudioInput />
              {(uploadState && uploadState.copyrightChecked) && uploadState.selectedFile &&
                <>
                  <ArtworkInput />
                  <DetailsInput />
                  <MintPrice />
                  <RoyaltySplitsInput />
                  {uploadState.selectedCategory==="music" &&
                    <LyricsInput />
                  }
                </>
              }
              <UploadButton />
          </div>
        </div>
      </div>
      {showModal && (
        <HitmakrMiniModal
          title="Invalid File Type"
          description="Please select an MP3, WAV, or FLAC file."
          closeButton={<i className="fi fi-br-cross-small"></i>}
          closeFunction={() => setShowModal(false)}
          isAction={true}
        />
      )}
    </>
  );
}