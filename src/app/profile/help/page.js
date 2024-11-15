"use client"

import styles from "./styles/Help.module.css";
import { faqCreatives,faqUsers } from "@/lib/metadata/HelpData";
import ThirdPartyLinkFunction from "@/app/helpers/ThirdPartyLinkFunction";

export default function HelpPage(){

    const { handleThirdPartyLink, isLinkOpening } = ThirdPartyLinkFunction();
    
    return(<>
        <div className={styles.help}>
            <div className={styles.helpHeader}>
                <p>
                    Faq
                </p>
            </div>
            <div className={styles.helpContainer}>
                <div className={styles.helpContainerLeft}>
                    <div className={styles.helpContainerHeader}>
                        <p>
                            Creatives
                        </p>
                    </div>
                    <div className={styles.helpContainerQuestions}>
                        {faqCreatives.map((faq, index) => (
                            <div onClick={() => handleThirdPartyLink(`${faq[Object.keys(faq)[0]]}`)} key={index} className={styles.helpContainerQuestion}>
                                <p>
                                    {Object.keys(faq)[0]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={styles.helpContainerRight}>
                    <div className={styles.helpContainerHeader}>
                        <p>
                            Users
                        </p>
                    </div>
                    <div className={styles.helpContainerQuestions}>
                        {faqUsers.map((faq, index) => (
                            <div onClick={() => handleThirdPartyLink(`${faq[Object.keys(faq)[0]]}`)} key={index} className={styles.helpContainerQuestion}>
                                <p>
                                    {Object.keys(faq)[0]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </>)
}