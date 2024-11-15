"use client"

import React, { useEffect, useState } from "react";
import styles from "../styles/Auth.module.css";
import '@flaticon/flaticon-uicons/css/all/all.css';
import { useAccount, useSwitchChain } from "wagmi";
import AuthDetails from "./AuthDetails";
import AuthAction from "./AuthAction";
import { ConnectKitButton, useSIWE } from "connectkit";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import { skaleChainId } from "@/lib/secure/Config";
import { authLinks } from "@/lib/helpers/Links";
import WalletDisconnectFunction from "@/app/helpers/WalletDisconnectFunction";
import GetNativeTokenBalance from "@/app/helpers/GetNativeTokenBalance";
import ThirdPartyLinkFunction from "@/app/helpers/ThirdPartyLinkFunction";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import ValidateUsername from "../helpers/ValidateUsername";
import AuthActionTextInput from "./AuthActionTextInput";
import { useRecoilValue } from "recoil";
import HitmakrProfileStore from "@/app/config/store/HitmakrProfileStore";
import { useHasProfile } from "@/app/config/hitmakrprofiles/hitmakrProfilesRPC";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import tandds from "@/lib/helpers/TandD";


export default function AuthMain() {
    const [isDeAuthLoading, setIsDeAuthLoading] = useState(true);
    const { isConnected, address, isDisconnected, status: accountStatus,chainId:currentChainId  } = useAccount();
    const { isSignedIn, isLoading: siweConnecting, signIn, signOut } = useSIWE();
    const { routeTo, isRouterLinkOpening } = RouterPushLink();
    const { handleWalletDisconnect, isDisconnecting } = WalletDisconnectFunction();
    const { chains, switchChain, isPending: networkSwitching } = useSwitchChain();
    const { balanceData } = GetNativeTokenBalance();
    const { handleThirdPartyLink, isLinkOpening } = ThirdPartyLinkFunction();
    const { MintName } = ValidateUsername();
    const hitmakrProfileMint = useRecoilValue(HitmakrProfileStore.HitmakrProfileMint);
    const { hasProfile, loading:hasProfileLoading, error:hasProfileError } = useHasProfile(address)
    useEffect(() => {
        const delay = setTimeout(() => {
            setIsDeAuthLoading(false);
        }, 1500);

      
        return () => {
            clearTimeout(delay);
        };
    }, [accountStatus]);

    const handleNetworkSwitch = async () => {
        try {
            await switchChain({ chainId: skaleChainId });
        } catch (error) {
            if (error) { 
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: `0x${skaleChainId.toString(16)}`,
                            chainName: 'SKALE Calypso Testnet',
                            nativeCurrency: {
                                name: 'sFUEL',
                                symbol: 'sFUEL',
                                decimals: 18
                            },
                            rpcUrls: [process.env.NEXT_PUBLIC_SKALE_RPC_URL],
                        }]
                    });
                } catch (addError) {
                    console.error('Error adding network:', addError);
                }
            } else {
                console.error('Error switching network:', error);
            }
        }
    };


    return (
        <>
            <div className={styles.authMain}>
                <div className={styles.authMainContainer}>
                    {isDeAuthLoading ? (
                        <LoaderWhiteSmall />
                    ) : (
                        <>
                            {!isConnected && (
                                <>
                                    <AuthDetails title={"Connect"} description={"your web3 wallet and continue"} />
                                    <ConnectKitButton.Custom>
                                        {({ isConnected, isConnecting: accountConnecting, show }) => {
                                            return (
                                                <>
                                                    {!isConnected && show && (
                                                        <AuthAction action={<HitmakrButton buttonFunction={show} isLoading={accountConnecting} isDark={false} buttonName={"Authenticate"} buttonWidth={"75%"} />} />
                                                    )}
                                                </>
                                            );
                                        }}
                                    </ConnectKitButton.Custom>
                                </>
                            )}
                            {isConnected && !isSignedIn && (
                                <>
                                    <AuthDetails title={"SIWE"} description={"Signature based Authentication"} />
                                    <AuthAction action={<HitmakrButton buttonFunction={signIn} isLoading={siweConnecting} isDark={false} buttonName={"Sign In"} buttonWidth={"75%"} />} />
                                    {isConnected && currentChainId !== skaleChainId && 
                                        <>
                                            <HitmakrMiniModal title={tandds.switchNetworkToSkaleToMintTitle} description={tandds.switchNetworkToSkaleToMintDescription} learnMoreLink={authLinks.networkSwitch}  closeFunction={()=> handleWalletDisconnect()} closeButton={<i className="fi fi-br-power"></i>} isAction={true} actionButton={<HitmakrButton buttonFunction={()=> handleNetworkSwitch()} isLoading={networkSwitching} isDark={false} buttonName={"Change Network"} buttonWidth={"75%"}/>}/>
                                        </>
                                    }
                                </>
                            )}
                            {isConnected && isSignedIn && !hasProfile && (
                                <>
                                    <AuthDetails title={"Profile"} description={"Mint your decentralized profile identity"} />
                                    <AuthActionTextInput isUsername={true} inputStatusIcon={<i className="fi fi-sr-check-circle"></i>} />
                                    <AuthAction action={<HitmakrButton buttonFunction={() => MintName()} isLoading={hitmakrProfileMint.isMintLoading} isDark={hitmakrProfileMint.mintNameStatus ? false : true} buttonName={"Mint Profile"} buttonWidth={"75%"} />} />
                                    {isConnected && currentChainId !== skaleChainId && 
                                        <>
                                            <HitmakrMiniModal title={tandds.switchNetworkToSkaleToMintTitle} description={tandds.switchNetworkToSkaleToMintDescription} learnMoreLink={authLinks.networkSwitch}  closeFunction={()=> handleWalletDisconnect()} closeButton={<i className="fi fi-br-power"></i>} isAction={true} actionButton={<HitmakrButton buttonFunction={()=> handleNetworkSwitch()} isLoading={networkSwitching} isDark={false} buttonName={"Change Network"} buttonWidth={"75%"}/>}/>
                                        </>
                                    }
                                    {balanceData?.value===0n && currentChainId === skaleChainId && 
                                        <>
                                            <HitmakrMiniModal title={tandds.zeroBalanceSkaleNetworkTitle} learnMoreLink={authLinks.sFuelStation} description={tandds.zeroBalanceSkaleNetworkDescription} closeFunction={() => handleWalletDisconnect()} closeButton={<i className="fi fi-br-power"></i>} isAction={true} actionButton={<HitmakrButton buttonFunction={() => handleThirdPartyLink(authLinks.sFuelStation)} isLoading={isLinkOpening} isDark={false} buttonName={"Get Free Gas"} buttonWidth={"75%"}/>} />
                                        </>
                                    }
                                </>
                            )}
                            {isConnected && isSignedIn && hasProfile && (
                                <>
                                    <AuthDetails title={"Hurray!"} description={"Welcome! Explore the music on Web3"} />
                                    <AuthAction action={<HitmakrButton buttonFunction={() => routeTo("/profile")} isLoading={isRouterLinkOpening("/profile")} isDark={true} buttonName={"Profile"} buttonWidth={"75%"} />} />
                                    <AuthAction action={<HitmakrButton buttonFunction={() => routeTo("/")} isLoading={isRouterLinkOpening("/")} isDark={false} buttonName={"Home"} buttonWidth={"75%"} />} />
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}