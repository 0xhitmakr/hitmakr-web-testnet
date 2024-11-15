"use client"

import { useSIWE } from "connectkit";
import { useDisconnect } from "wagmi";
import { useSetRecoilState, useResetRecoilState } from 'recoil';
import PlayerStore from "../config/store/PlayerStore";


export default function WalletDisconnectFunction() {
    const { signOut } = useSIWE();
    const { disconnect, isPending: isDisconnecting } = useDisconnect();
    const setPlayerState = useSetRecoilState(PlayerStore.PlayerState);
    const resetPlayerState = useResetRecoilState(PlayerStore.PlayerState);

    const defaultPlayerState = {
        isPlaying: false,
        queue: [],
        currentTrack: null,
        isShuffle: false,
        isRepeat: false,
        playHistory: [],
    };


    const handleWalletDisconnect = () => {
        resetPlayerState();  
        setPlayerState(defaultPlayerState);

        signOut();
        disconnect();

        if (typeof window !== 'undefined') {
            window.localStorage.removeItem('PlayerStore');
            
            window.localStorage.removeItem('recoil-persist');
            
            window.localStorage.clear();  
        }

        window.location.replace("/auth");
    }

    return { handleWalletDisconnect, isDisconnecting };
}