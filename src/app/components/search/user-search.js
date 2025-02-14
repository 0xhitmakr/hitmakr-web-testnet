"use client";

import React from "react";
import styles from "./search.module.css";
import {
  useNameByAddress,
  useProfileAddressByName,
} from "@/app/config/hitmakrprofiles/hitmakrProfilesRPC";
import { useRouter } from "next/navigation";
import { useVerificationStatusRPC } from "@/app/config/hitmakrverification/hitmakrVerificationRPC";
import GetDpByAddress from "@/app/helpers/profile/GetDpByAddress";
import { ethers } from "ethers";

const isValidEthereumAddress = (address) => {
  return ethers.isAddress(address);
};

const UserSearch = ({ address, onClear }) => {
  const userAddress = isValidEthereumAddress(address) ? address : null;
  const userName = isValidEthereumAddress(address) ? null : address;

  const router = useRouter();

  const { address: resolvedAddress, loading: addressLoading } = useProfileAddressByName(userName);
  const finalAddress = userAddress || resolvedAddress;
  
  const { name, loading: nameLoading } = useNameByAddress(finalAddress);
  const { isVerified, loading: isVerifiedLoading } = useVerificationStatusRPC(finalAddress);

  if (!address?.trim()) {
    return (
      <p className="text-center">
        Search User or Artist
      </p>
    );
  }

  if (nameLoading || isVerifiedLoading || addressLoading) {
    return (
      <p className="text-center">
        Loading...
      </p>
    );
  }

  if (!name || !finalAddress) {
    return (
      <p className="text-center">
        No User/Artist found
      </p>
    );
  }

  return (
    <div
      className={styles.userMain}
      role="button"
      onClick={() => {
        router.push(`/profile?address=${finalAddress}&view=about`);
        onClear();
      }}
    >
      <div className={styles.userImage}>
        <GetDpByAddress
          address={finalAddress}
          width={100}
          height={100}
          key={finalAddress}
        />
      </div>
      <div className={styles.userName}>
        <p>
          {name} {isVerified && <i className="fi fi-sr-badge-check"></i>}
        </p>
        <span>
          {finalAddress?.slice(0, 6)}...{finalAddress?.slice(-4)}
        </span>
      </div>
    </div>
  );
};

export default UserSearch;