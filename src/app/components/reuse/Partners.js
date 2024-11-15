"use client"

import styles from "./styles/Partners.module.css";
import '@flaticon/flaticon-uicons/css/all/all.css';
import HitmakrLogo from "@/../public/svgs/auth/HitmakrLogo25x.svg"
import '@flaticon/flaticon-uicons/css/all/all.css';


export default function Partners({partnerLogo}) {
    return (
        <>
            <div className={styles.partners}>
                <div className={styles.partnersContainer}>
                    <div className={styles.partnersLogos}>
                        <div className={styles.partnerLogo}>
                            <HitmakrLogo />
                        </div>
                        <div className={styles.partnerX}>
                            <i className="fi fi-br-cross"></i>
                        </div>
                        <div className={styles.partnerLogo}>
                            <span>
                                {partnerLogo}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
