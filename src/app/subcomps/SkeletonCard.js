
"use client"

import styles from "./styles/TopLiked.module.css";

export default function SkeletonCard() {
    return (
        <div className={styles.dsrcCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.dsrcInfo}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonCreator} />
                <div className={styles.skeletonActions}>
                    <div className={styles.skeletonButton} />
                    <div className={styles.skeletonButton} />
                </div>
            </div>
        </div>
    );
}

