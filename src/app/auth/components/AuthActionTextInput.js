"use client"

import React from "react";
import styles from "../styles/Auth.module.css";
import HitmakrProfileStore from "@/app/config/store/HitmakrProfileStore";
import { useRecoilState } from "recoil";


export default function AuthActionTextInput({isUsername, inputStatusIcon}) {
    const [hitmakrProfileMintState, setHitmakrProfileMintState] = useRecoilState(HitmakrProfileStore.HitmakrProfileMint);


    const handleOnInputChange = (e) => {
        let value = e.target.value;
        if (isUsername) {
            value = value.toLowerCase();
            value = value.replace(/[^a-z0-9]/g, '');
            value = value.slice(0, 20);
            setHitmakrProfileMintState((prevState) => ({
                ...prevState,
                mintName: value,
            }));
        } else {
            setHitmakrProfileMintState((prevState) => ({
                ...prevState,
                mintName: value,
            }));
        }
    }

    return (
        <>
            <div className={styles.authActionText}>
                <div className={styles.authActionTextInputContainer}>
                    <input 
                        value={hitmakrProfileMintState.mintName} 
                        onChange={handleOnInputChange} 
                        placeholder='vitalik' 
                        maxLength={20} 
                        className={styles.authActionTextInput}
                    />
                    <div className={hitmakrProfileMintState.mintNameStatus ? `${styles.authActionTextInputStatusActive}` : `${styles.authActionTextInputStatus}`}>
                        {inputStatusIcon}
                    </div>
                </div>
            </div>
        </>
    );
}
