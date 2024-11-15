"use client"

import React, { useRef, useState, useEffect } from "react";
import styles from "../styles/Auth.module.css";
import Image from "next/image";
import AuthImage from "@/../public/images/auth/auth-img.webp";
import SIWEImage from "@/../public/images/auth/siwe-img.webp";
import ProfileImage from "@/../public/images/auth/profile-img.webp";
import SkipImage from "@/../public/images/auth/skip-img.webp";
import AuthMusic from "@/../public/music/auth/AuthMusic.mp3";
import '@flaticon/flaticon-uicons/css/all/all.css';
import HitmakrLogoWithName from "@/../public/svgs/auth/HitmakrWithName.svg";
import Link from "next/link";
import { legalLinks } from "@/lib/helpers/Links";
import AuthMain from "./AuthMain";
import { useAccount } from "wagmi";
import { useSIWE } from "connectkit";
import { useHasProfile } from "@/app/config/hitmakrprofiles/hitmakrProfilesRPC";


export default function AuthContainer() {
    const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const {isConnected,address} = useAccount();
  const {isSignedIn} = useSIWE();
  const { hasProfile, loading:hasProfileLoading, error:hasProfileError } = useHasProfile(address)

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
    }

    return () => {
      if (audio) {
        audio.removeEventListener('play', () => setIsPlaying(true));
        audio.removeEventListener('pause', () => setIsPlaying(false));
      }
    };
  }, []);



  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error("Autoplay prevented:", error);
          setIsPlaying(false);
        });
      }
    }
  };

  const getImage = () => {
    if(!isConnected){
      return AuthImage;
    }else if(isConnected && !isSignedIn){
      return SIWEImage;
    }else if(isConnected && isSignedIn && !hasProfile){
      return ProfileImage;
    }else if(isConnected && isSignedIn && hasProfile){
      return SkipImage;
    }
  };

  return (
    <>
      
      <div className={styles.authContainer}>
        <div className={styles.authContainerLeft}>
          <Image
            src={getImage()}
            width={1920}
            height={1080}
            alt="Auth Background Image"
            priority
            unoptimized
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          <audio ref={audioRef} src={AuthMusic} loop/>

          <div className={styles.audioControls}>
            <span onClick={handlePlayPause}>
                {isPlaying ? <i className="fi fi-sr-pause"></i> : <i className="fi fi-sr-play"></i>}
            </span>
          </div>
        </div>
        <div className={styles.authContainerRight}>
          <Image
              src={getImage()}
              width={1920}
              height={1080}
              alt="Auth Background Image"
              priority
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className={styles.transparentLayer}></div>
            <div className={styles.transparentLayer2}></div>
            <div className={styles.authContainerRightHeader}>
                <HitmakrLogoWithName />
            </div>
            <AuthMain />
            <div className={styles.authContainerRightFooter}>
                <div className={styles.authContainerRightFooterOptions}>
                    <div className={styles.authContainerRightFooterOption}>
                        <Link href={legalLinks.terms}>
                            <p>
                                Terms of Use
                            </p>
                        </Link>
                    </div>
                    <div className={styles.authContainerRightFooterOption}>
                        <Link href={legalLinks.privacy}>
                            <p>
                                Privacy Center
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
