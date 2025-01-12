"use client"

import React from "react";
import { RecoilRoot } from "recoil";
import { MusicPlayerProvider } from "./audio/MusicPlayerProvider";
import AppKitProvider from "./appkit/AppKitProvider";

export default function HitmakrConfig({ children }) {
    return (
        <>
            <AppKitProvider>
                <RecoilRoot>
                    <MusicPlayerProvider>
                        { children }
                    </MusicPlayerProvider>
                </RecoilRoot>
            </AppKitProvider>
        </>
    );
}
