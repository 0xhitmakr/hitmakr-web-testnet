"use client"

import React from "react";
import LoaderBlackSmall from "../animations/loaders/loaderBlackSmall";
import LoaderWhiteSmall from "../animations/loaders/loaderWhiteSmall";
import styles from "../buttons/styles/HitmakrButton.module.css";


export default function HitmakrButton({buttonFunction,isLoading,buttonName,isDark = false,buttonWidth}){
    return(<>
        <button onClick={() => buttonFunction()} className={`${styles.button} ${isDark? styles.dark : ''}`} style={{width:`${buttonWidth}`}}>
            {isLoading ? (
                <>
                    {isDark &&
                        <LoaderWhiteSmall />
                    }
                    {!isDark &&
                        <LoaderBlackSmall />
                    }
                </>
            ) : (
            `${buttonName}`
            )}
        </button>
    </>)
}