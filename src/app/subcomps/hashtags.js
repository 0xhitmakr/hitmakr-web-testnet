"use client";

import React, { useState } from "react";
import ReactDOM from "react-dom";
import styles from "../components/modals/styles/MiniModal.module.css";
import secondStyles from "./hashtags.module.css";
import axios from "axios";
import { useAccount } from "wagmi";
import { X } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

const HashTagsModal = ({ closeFunction, id, hashTags }) => {
  const [hashtags, setHashTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [tags, setTags] = useState(hashTags);
  const { address } = useAccount();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/song/hashtags`, {
        walletAddress: address,
        hashtag: hashtags,
        songId: id,
      });
      setLoading(false);
      closeFunction();
    } catch (error) {
      setLoading(false);
      setError(error?.response?.data?.message || "Failed to add Hashtag");
    }
  };

  const handleDeleteTag = async (tag) => {
    try {
      setIsDeleting(true);
      const res = await axios.put(`${API_BASE_URL}/song/hashtags?id=${id}`, {
        hashtag: tag,
      });
      if (res.data.status) {
        setTags((prev) => prev.filter((t) => t !== tag));
      }
      setIsDeleting(false);
    } catch (error) {
      setIsDeleting(false);
      setError(error.response.data.message || "Failed to add Hashtag");
    }
  };

  const modalContent = (
    <div className={styles.miniModal}>
      <div className={styles.miniModalContainer}>
        <div className={styles.miniModalContainerHeader}>
          <div className={styles.miniModalContainerHeaderTitle}>
            Add HashTags
          </div>
          <div className={styles.miniModalContainerHeaderClose}>
            <span title="close or Disconnect" onClick={() => closeFunction()}>
              <i className="fi fi-br-cross-small"></i>
            </span>
          </div>
        </div>
        <div className={secondStyles.hashtag}>
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Enter hashtag"
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, "");
                setHashTags(value);
                setError("");
              }}
              value={hashtags}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Adding.." : "Submit"}
            </button>
          </form>
          <p>{error}</p>

          {hashTags?.length > 0 && (
            <div className={secondStyles.deletetag}>
              {tags?.map((value) => (
                <div key={value}>
                  <span>#{value}</span>
                  <button
                    disabled={isDeleting}
                    style={{
                      color: isDeleting ? "silver" : "red",
                    }}
                    onClick={() => handleDeleteTag(value)}
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") {
    return null;
  }

  return ReactDOM.createPortal(modalContent, document.body);
};

export default HashTagsModal;
