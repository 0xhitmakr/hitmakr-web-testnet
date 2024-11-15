"use client";

import React from 'react';
import PropTypes from 'prop-types';
import { useProfileDetailsRPC } from '@/app/config/hitmakrprofiledetails/hitmakrProfileDetailsRPC';
import styles from '../styles/Helpers.module.css';
import { useAccount } from 'wagmi';

const GetProfileDetails = ({
  address,
  className = '',
  fallbackName = 'Anonymous',
  fallbackBio = 'No bio available',
  showLoadingState = true,
  size = 'base'
}) => {
  const {
    details: profileDetails,
    loading: profileLoading,
    error: profileError
  } = useProfileDetailsRPC(address);

  const textSizeClass = styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`];

  if (profileLoading && showLoadingState) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.profileLoading}></div>
        <div className={styles.bioLoading}></div>
      </div>
    );
  }

  if (profileError || !profileDetails) {
    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileContainerOption}>
                <p>
                    <b>
                        Full Name
                    </b>
                </p>
                <p className={`${styles.profileNameFallback} ${textSizeClass} ${className}`}>
                    {fallbackName}
                </p>
            </div>
            <div className={styles.profileContainerOption}>
                <p>
                    <b>
                        Bio
                    </b>
                </p>
                <p className={styles.profileBio}>
                    {fallbackBio}
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
        <div className={styles.profileContainerOption}>
            <span>
                <b>
                    Full Name
                </b>
            </span>
            <p className={`${styles.profileName} ${textSizeClass} ${className}`}>
                {profileDetails.fullName || fallbackName}
            </p>
        </div>
        <div className={styles.profileContainerOption}>
            <span>
                <b>
                    Bio
                </b>
            </span>
            <p className={styles.profileBio}>
                {profileDetails.bio || fallbackBio}
            </p>
        </div>
    </div>
  );
};

GetProfileDetails.propTypes = {
  address: PropTypes.string.isRequired,
  className: PropTypes.string,
  fallbackName: PropTypes.string,
  fallbackBio: PropTypes.string,
  showLoadingState: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'base', 'lg', 'xl', '2xl'])
};

export default GetProfileDetails;