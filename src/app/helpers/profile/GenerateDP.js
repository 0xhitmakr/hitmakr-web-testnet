"use client";

import { createAvatar } from "@dicebear/core";
import { avataaarsNeutral } from "@dicebear/collection";
import { useAccount } from "wagmi";
import { useCompleteProfileRPC } from "@/app/config/hitmakrprofiledetails/hitmakrProfileDetailsRPC";
import Image from "next/image";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";

export default function GenerateDp({ seed, options, width, height }) {
  const { isConnected, address } = useAccount();
  const { profile, loading, error } = useCompleteProfileRPC(address);

  const avatar = createAvatar(avataaarsNeutral, {
    seed: seed || "hitmakr",
    ...options,
  });

  const svgString = profile?.imageURI || avatar.toString();

  if (loading) {
    return (<>
      <LoaderWhiteSmall />
    </>);
  }

  if (error) {
    return (
      <Image
        src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`}
        alt="Generated Avatar"
        width={width}
        height={height}
        unoptimized
      />
    );
  }

  return (
    <>
      {profile?.imageURI ? (
        <Image
          src={profile.imageURI}
          alt="Profile Picture"
          width={width}
          height={height}
          unoptimized
        />
      ) : (
        <Image
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`}
          alt="Generated Avatar"
          width={width}
          height={height}
          unoptimized
        />
      )}
    </>
  );
}