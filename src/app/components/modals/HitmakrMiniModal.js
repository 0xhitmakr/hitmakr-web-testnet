"use client"

import React from "react";
import ReactDOM from 'react-dom';
import styles from "./styles/MiniModal.module.css";


export default function HitmakrMiniModal({title, closeButton, description, closeFunction, isAction, actionButton}) {
    const modalContent = (
        <div className={styles.miniModal}>
            <div className={styles.miniModalContainer}>
                <div className={styles.miniModalContainerHeader}>
                    <div className={styles.miniModalContainerHeaderTitle}>
                        {title}
                    </div>
                    <div className={styles.miniModalContainerHeaderClose}>
                        <span title="close or Disconnect" onClick={() => closeFunction()}>
                            {closeButton}
                        </span>
                    </div>
                </div>
                <div className={styles.miniModalContainerDescription}>
                    <p>
                        {description}
                    </p>
                </div>
                {isAction &&
                    <div className={styles.miniModalContainerAction}>
                        {actionButton}
                    </div>
                }
            </div>
        </div>
    );

    if (typeof window === 'undefined') {
        return null;
    }

    return ReactDOM.createPortal(
        modalContent,
        document.body
    );
}