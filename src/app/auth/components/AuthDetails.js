"use client"

import React from "react";
import styles from "../styles/Auth.module.css";


export default function AuthDetails({title, description}){
    return(<>
        <div className={styles.authDetails}>
            <div className={styles.authTitle}>
                <span>
                    {title}
                </span>
            </div>
            <div className={styles.authDescription}>
                <span>
                    {description}
                </span>
            </div>
        </div>
    </>)
}
