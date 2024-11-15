"use client"

import React,{useState} from "react";



export default function ThirdPartyLinkFunction() {
    const [isLinkOpening, setIsLinkOpening] = useState(false);

  
    const handleThirdPartyLink = (link) => {
        try {
            setIsLinkOpening(true);
            window.open(link, '_blank');

            setTimeout(() => {
                setIsLinkOpening(false);
            }, 1000);
        } catch {
            console.log("cannot open the link");
        }
    }

    return { handleThirdPartyLink, isLinkOpening }
}
