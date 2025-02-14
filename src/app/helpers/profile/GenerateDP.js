"use client";

import { createAvatar } from "@dicebear/core";
import { avataaarsNeutral } from "@dicebear/collection";
import { useAccount } from "wagmi";
import { useProfileDetailsRPC } from "@/app/config/hitmakrprofiledetails/hitmakrProfileDetailsRPC";
import Image from "next/image";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";

export default function GenerateDP({ seed, options, width, height }) {
  const { isConnected, address } = useAccount();
  const { details, loading, error } = useProfileDetailsRPC(address);

  // Create default avatar
  const avatar = createAvatar(avataaarsNeutral, {
    seed: seed || "hitmakr",
    ...options,
  });

  // Generate SVG string based on profile existence
  const svgString = details?.imageURI || avatar.toString();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LoaderWhiteSmall />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Image
          src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`}
          alt="Generated Avatar"
          width={width}
          height={height}
          className="rounded-full"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      {details?.imageURI ? (
        <Image
          src={details.imageURI}
          alt={`Profile Picture - ${details.fullName || 'User'}`}
          width={width}
          height={height}
          className="rounded-full object-cover"
          unoptimized
        />
      ) : (
        <Image
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`}
          alt="Generated Avatar"
          width={width}
          height={height}
          className="rounded-full"
          unoptimized
        />
      )}
    </div>
  );
}