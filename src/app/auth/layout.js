import React from "react";
import styles from "./styles/Auth.module.css";
import { getMetadata } from "@/lib/metadata/LayoutsMetadata";

export const metadata = getMetadata('auth');


export default function AuthLayout({children}){
    return(<>
        <div className={styles.auth}>
            {children}
        </div>
    </>)
}
