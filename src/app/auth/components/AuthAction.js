"use client"

import React from "react"
import styles from "../styles/Auth.module.css";


export default function AuthAction({action}){
    return(<>
        <div className={styles.authAction}>
            <div className={styles.authActionEvent}>
                {action}
            </div>
        </div>
    </>)
}
