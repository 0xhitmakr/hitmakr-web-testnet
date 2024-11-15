import React, { useEffect, useState } from "react";
import styles from "../../styles/Create.module.css";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

const RoyaltySplitsInput = () => {
  const { address } = useAccount();
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const { royaltySplits, newAddress } = uploadState;
  const MAX_ROYALTY_PERCENTAGE = 100;

  const [error, setError] = useState("");

  useEffect(() => {
    if (royaltySplits.length === 0 && address) {
        try {
            const normalizedAddress = ethers.getAddress(address.toLowerCase());
            setUploadState({
                ...uploadState,
                royaltySplits: [
                    {
                        address: normalizedAddress,
                        role: "Artist",
                        percentage: MAX_ROYALTY_PERCENTAGE,
                        id: 0,
                    },
                ],
            });
        } catch (error) {
            console.error('Error setting initial royalty split:', error);
        }
    }
}, [address, royaltySplits.length, setUploadState, uploadState]);

  

  const handleAddAddress = () => {
    try {
        const normalizedAddress = ethers.getAddress(newAddress.toLowerCase());
        
        if (royaltySplits.some(split => split.address.toLowerCase() === normalizedAddress.toLowerCase())) {
            setError("Address already added to the splits.");
            return;
        }

        const newSplit = {
            address: normalizedAddress, 
            role: "Other",
            percentage: 0,
            id: Date.now(),
        };

        setUploadState({
            ...uploadState,
            royaltySplits: [...royaltySplits, newSplit],
            newAddress: "",
        });
        setError("");
    } catch (error) {
        setError("Please enter a valid wallet address.");
    }
};

  const handleRoleChange = (id, newRole) => {
    setUploadState({
      ...uploadState,
      royaltySplits: royaltySplits.map((split) =>
        split.id === id ? { ...split, role: newRole } : split
      ),
    });
  };

  const handleRemoveAddress = (id) => {
    if (id === 0) return;
    setUploadState({
      ...uploadState,
      royaltySplits: royaltySplits.filter((split) => split.id !== id),
    });
  };

  const isValidAddress = (address) => {
    return address.startsWith("0x") && address.length === 42;
  };

  const handleSplitEvenly = () => {
    const numSplits = royaltySplits.length;
    if (numSplits === 0) return;

    const baseAmount = Math.floor((MAX_ROYALTY_PERCENTAGE / numSplits) * 100) / 100;
    const remainder = MAX_ROYALTY_PERCENTAGE - (baseAmount * (numSplits - 1));

    const updatedSplits = royaltySplits.map((split, index) => ({
        ...split,
        percentage: index === 0 ? remainder : baseAmount
    }));

    setUploadState({
        ...uploadState,
        royaltySplits: updatedSplits,
    });
  };

  const handleSplitRemaining = () => {
    const totalAllocated = royaltySplits.reduce((sum, split) => sum + split.percentage, 0);
    const remaining = MAX_ROYALTY_PERCENTAGE - totalAllocated;

    if (remaining <= 0) {
      setError("No remaining percentage to split.");
      return;
    }

    const splitsToUpdate = royaltySplits.filter(split => split.percentage < MAX_ROYALTY_PERCENTAGE);
    
    if (splitsToUpdate.length === 0) {
      setError("No addresses available to split the remaining percentage.");
      return;
    }

    const baseSplitAmount = Math.floor((remaining / splitsToUpdate.length) * 100) / 100;
    const totalBaseAmount = baseSplitAmount * (splitsToUpdate.length - 1);
    const firstSplitAmount = remaining - totalBaseAmount;

    let remainingDistributed = false;

    const updatedSplits = royaltySplits.map(split => {
      if (split.percentage < MAX_ROYALTY_PERCENTAGE) {
        if (!remainingDistributed) {
          remainingDistributed = true;
          return { ...split, percentage: split.percentage + firstSplitAmount };
        }
        return { ...split, percentage: split.percentage + baseSplitAmount };
      }
      return split;
    });

    setUploadState({
      ...uploadState,
      royaltySplits: updatedSplits,
    });
    setError("");
  };

  const handlePercentageChange = (id, newPercentage) => {
    const parsedPercentage = parseFloat(newPercentage);
    
    if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > MAX_ROYALTY_PERCENTAGE) {
        setError(`Percentage must be between 0 and ${MAX_ROYALTY_PERCENTAGE}`);
        return;
    }

    const roundedPercentage = Math.round(parsedPercentage * 100) / 100;

    const updatedSplits = royaltySplits.map(split =>
        split.id === id ? { ...split, percentage: roundedPercentage } : split
    );

    const totalPercentage = updatedSplits.reduce(
        (sum, split) => sum + parseFloat(split.percentage || 0), 
        0
    );

    if (totalPercentage > MAX_ROYALTY_PERCENTAGE + 0.01) {
        setError(`Total percentage cannot exceed ${MAX_ROYALTY_PERCENTAGE}%`);
        return;
    }

    setUploadState({
        ...uploadState,
        royaltySplits: updatedSplits,
    });
    setError("");
};

  const totalAllocated = royaltySplits.reduce((sum, split) => sum + split.percentage, 0);

  return (
    <div className={styles.createUploadContainerInput}>
      <div className={styles.createUploadContainerInputCover}>
        <div className={styles.createUploadContainerInputTitle}>
          <p>Royalty Splits</p>
        </div>
        <div className={styles.formDetails}>
          <div className={styles.addAddressInput}>
            <input
              type="text"
              placeholder="Wallet address or DSRC address"
              value={newAddress}
              onChange={(e) =>
                setUploadState({ ...uploadState, newAddress: e.target.value })
              }
              className={styles.formDetailsInput}
            />
            <button
              onClick={handleAddAddress}
              className={styles.royaltySplitButton}
            >
              <i className={`fi fi-br-plus`}></i>
            </button>
          </div>
        </div>
        
        {royaltySplits.map((split) => (
          <div key={split.id} className={styles.formDetails}>
            <div className={styles.royaltySplitRow}>
              <span>
                <p className={styles.royaltySplitAddress}>
                  {split.address.slice(0, 5)}...{split.address.slice(-4)}
                </p>
              </span>
              <span>
                <select
                  value={split.role}
                  onChange={(e) => handleRoleChange(split.id, e.target.value)}
                  className={styles.royaltySplitSelect}
                >
                  <option value="Artist">Artist</option>
                  <option value="Producer">Producer</option>
                  <option value="Other">Other</option>
                </select>
                <div className={styles.percentageInput}>
                  <input
                    type="number"
                    min="0"
                    max={MAX_ROYALTY_PERCENTAGE}
                    value={split.percentage}
                    onChange={(e) => handlePercentageChange(split.id, e.target.value)}
                    className={styles.royaltySplitPercentageInput}
                  />
                  <span>%</span>
                </div>
                <button
                  onClick={() => handleRemoveAddress(split.id)}
                  disabled={split.id === 0}
                  className={styles.royaltySplitButton}
                >
                  <i className={`fi fi-br-cross`}></i>
                </button>
              </span>
            </div>
          </div>
        ))}
        {error && <p className={styles.errorMessage}>{error}</p>}
        <div className={styles.formDetails}>
          <div className={styles.splitButtons}>
            <button
              onClick={handleSplitEvenly}
              className={styles.royaltySplitButton}
            >
              Split Evenly
            </button>
            <button
              onClick={handleSplitRemaining}
              className={styles.royaltySplitButton}
            >
              Split Remaining
            </button>
          </div>
        </div>
        <p className={styles.progressBarText}>
          Royalty Split: {totalAllocated.toFixed(2)}% of sales revenue
          <br />
          Remaining to allocate: {(MAX_ROYALTY_PERCENTAGE - totalAllocated).toFixed(2)}%
        </p>
        <div className={styles.progressBar}>
          <div
            className={styles.progressBarFill}
            style={{
              width: `${totalAllocated}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RoyaltySplitsInput;