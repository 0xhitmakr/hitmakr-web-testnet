"use client"

import React from "react";
import { RecoilRoot } from "recoil";
import AppKitProvider from "./appkit/AppkitProvider";
import CampAuthProvider from "./camp/CampAuthProvider";
import { CampProvider } from "@campnetwork/sdk/react";
import MusicPlayerProvider from "./audio/MusicPlayerProvider";

export default function HitmakrConfig({ children }) {
    return (
        <>
            <AppKitProvider>
                <RecoilRoot>
                    <CampProvider clientId="eeba158e-cd7f-4097-bf01-c9f65d47bc77">
                        <CampAuthProvider>
                            <MusicPlayerProvider>
                                { children }
                            </MusicPlayerProvider>
                        </CampAuthProvider>
                    </CampProvider>
                </RecoilRoot>
            </AppKitProvider>
        </>
    );
}
