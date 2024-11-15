import React from "react";
import DSRCView from "@/app/profile/components/releases/components/DSRCView";
import styles from "../styles/DSRCStyles.module.css"

export default function DSRCIdLayout({ children, params }) {
    const { dsrcid } = params;
    
    return (
        <>  
            <div className={styles.dsrcHeader}>
                <div className={styles.dsrcHeading}>
                    <p>{dsrcid}</p>
                </div>
            </div>
            <div className={styles.dsrcItem}>
                <DSRCView dsrcid={dsrcid} />
            </div>
            
            {children}
        </>
    );
}