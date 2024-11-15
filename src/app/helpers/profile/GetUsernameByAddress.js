"use client";

import React from 'react';
import PropTypes from 'prop-types';
import { useNameByAddress } from '@/app/config/hitmakrprofiles/hitmakrProfilesRPC';
import styles from '../styles/Helpers.module.css';

const GetUsernameByAddress = ({ 
  address,
  className = '',
  fallbackText = 'Unnamed',
  showLoadingState = true,
  size = 'base'
}) => {
  const { name, loading, error } = useNameByAddress(address);

  const textSizeClass = styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`];

  if (loading && showLoadingState) {
    return (
      <div className={styles.usernameContainer}>
        <div className={styles.usernameLoading}></div>
      </div>
    );
  }

  if (error || !name) {
    const truncatedAddress = address 
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : fallbackText;
      
    return (
      <div className={`${styles.usernameContainer} ${styles.truncate}`}>
        <p className={`${styles.usernameFallback} ${textSizeClass} ${styles.truncate} ${className}`}>
          {truncatedAddress}
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.usernameContainer} ${styles.truncate}`}>
      <p className={`${styles.usernameText} ${textSizeClass} ${styles.truncate} ${className}`}>
        {name || fallbackText}
      </p>
    </div>
  );
};

GetUsernameByAddress.propTypes = {
  address: PropTypes.string.isRequired,
  className: PropTypes.string,
  fallbackText: PropTypes.string,
  showLoadingState: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'base', 'lg', 'xl', '2xl'])
};

export default GetUsernameByAddress;