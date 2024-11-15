"use client";

import React, { useState } from "react";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import styles from "./styles/Feedback.module.css";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import { useAccount } from "wagmi";

const MAX_FEEDBACK_LENGTH = 1000;

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
  });
  const { address, chainId } = useAccount();

  const allDataSet = email && feedback;

  const handleChangeFeedback = (e) => {
    let value = e.target.value;
    if (value.length > MAX_FEEDBACK_LENGTH) {
      value = value.slice(0, MAX_FEEDBACK_LENGTH);
    }
    setFeedback(value);
  };

  const handleChangeEmail = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmitFeedback = async () => {
    const authToken = localStorage.getItem("authToken");

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/feedback/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "x-user-address": address,
            "x-chain-id": chainId.toString(),
          },
          body: JSON.stringify({ feedback, email }),
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
      console.error("Error submitting feedback:", error);
      setModalContent({
        title: "Error",
        description: "Failed to submit feedback. Please try again later.",
      });
    } finally {
      setIsLoading(false);
      setShowModal(true);
    }
  };

  return (
    <>
      <div className={styles.feedback}>
        <div className={styles.feedbackHeader}>
          <p>Feedback</p>
        </div>
        <div className={styles.feedbackContainer}>
          <div className={styles.formDetails}>
            <label htmlFor="feedback" className={styles.formDetailsLabel}>
              Feedback <small className={styles.inputLimit}>{feedback.length}/{MAX_FEEDBACK_LENGTH}</small>
            </label>
            <textarea
              id="feedback"
              name="feedback"
              value={feedback}
              onChange={handleChangeFeedback}
              className={styles.formDetailsInput}
              maxLength={MAX_FEEDBACK_LENGTH}
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
            />
          </div>
          <div className={styles.formDetails}>
            <label className={styles.formDetailsLabel}>
              <p>
              Lucky you 😜! Users get to share their thoughts about our awesome product once <span>every hour</span>. We know you're excited, but please help our developers catch their breath – they're working hard to make things even better!

              </p>
            </label>
          </div>
          <div className={styles.submitButton}>
            <HitmakrButton
              buttonWidth="50%"
              buttonFunction={handleSubmitFeedback}
              buttonName="Submit"
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