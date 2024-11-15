"use client"

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";


export default function RouterPushLink() {
    const [loadingStates, setLoadingStates] = useState({});
    const router = useRouter();

  
    const routeTo = useCallback(async (link) => {
        setLoadingStates(prev => ({ ...prev, [link]: true }));
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push(link);
        } catch (error) {
            console.log("Something went wrong in opening link!", error);
        } finally {
            setLoadingStates(prev => ({ ...prev, [link]: false }));
        }
    }, [router]);

   
    const isRouterLinkOpening = useCallback((link) => {
        return loadingStates[link] || false;
    }, [loadingStates]);

    return { routeTo, isRouterLinkOpening };
}
