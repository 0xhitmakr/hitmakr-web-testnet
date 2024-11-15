"use client"

import React from "react";
import { HitmakrConnectKitProvider } from "./connectkit/HitmakrConnectKitProvider";
import { RecoilRoot } from "recoil";
import { MusicPlayerProvider } from "./audio/MusicPlayerProvider";

export default function HitmakrConfig({ children }) {
    return (
        <>
            <HitmakrConnectKitProvider>
                <RecoilRoot>
                    <MusicPlayerProvider>
                        { children }
                    </MusicPlayerProvider>
                </RecoilRoot>
            </HitmakrConnectKitProvider>
        </>
    );
}
