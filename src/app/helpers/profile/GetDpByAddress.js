"use client";

import { createAvatar } from "@dicebear/core";
import { avataaarsNeutral } from "@dicebear/collection";
import { useProfileDetailsRPC } from "@/app/config/hitmakrprofiledetails/hitmakrProfileDetailsRPC";
import Image from "next/image";
import PropTypes from 'prop-types';

const GetDpByAddress = ({ 
  address, 
  seed, 
  options, 
  width = 100, 
  height = 100 
}) => {
  const {
    details: profileDetails, 
    loading: profileLoading, 
    error: profileError
  } = useProfileDetailsRPC(address);

  const avatar = createAvatar(avataaarsNeutral, {
    seed: seed || address || "Default Seed",
    ...options,
  });

  const imageURI = profileDetails?.imageURI;
  
  const svgString = imageURI || avatar.toString();

  if (profileLoading) {
    return (
      <div
        style={{ width: width, height: height }}
      />
    );
  }

  if (profileError) {
    return (
      <Image
        src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`}
        alt="Generated Avatar"
        width={width}
        height={height}
        className="rounded-full"
        unoptimized
      />
    );
  }

  return (
    <>
      {imageURI ? ( 
        <Image
          src={imageURI}
          alt="Profile Picture"
          width={width}
          height={height}
          className="rounded-full"
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
    </>
  );
};

GetDpByAddress.propTypes = {
  address: PropTypes.string.isRequired,
  seed: PropTypes.string,
  options: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number,
};

export default GetDpByAddress;