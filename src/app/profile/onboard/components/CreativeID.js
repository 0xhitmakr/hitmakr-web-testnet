import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRecoilState } from "recoil";
import styles from "../styles/Onboard.module.css";
import { countryData } from "@/lib/metadata/CountryData";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRegisterCreativeID } from '@/app/config/hitmakrcreativeid/hitmakrCreativeIDWagmi';
import { useCreativeIDRPC } from '@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC';
import { useIsCreativeIDTakenRPC } from '@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC';
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import { useSwitchChain } from 'wagmi';
import { skaleChainId } from "@/lib/secure/Config";
import { GetTransactionStatus } from "@/app/helpers/GetTransactionStatus";

const CreativeID = () => {
    const [selectedCountry, setSelectedCountry] = useState("");
    const [creativeCode, setCreativeCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const { address, isConnected } = useAccount();

    const { 
        register, 
        isPending: isRegistering, 
        data: registerData,
        isError: registerError
    } = useRegisterCreativeID();

    const { switchChain, isPending: networkSwitching } = useSwitchChain();
    
    const [hitmakrCreativesRegisterState, setHitmakrCreativesRegisterState] = useRecoilState(
        HitmakrCreativesStore.HitmakrCreativesRegister
    );

    const fullCreativeID = selectedCountry + creativeCode;

    const { 
        creativeIDInfo,
        loading: creativeIdLoading,
        error: creativeIdError
    } = useCreativeIDRPC(address);

    const {
        isTaken,
        loading: isValidationLoading
    } = useIsCreativeIDTakenRPC(fullCreativeID);

    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: "",
        description: "",
    });

    const { 
        txReceiptData, 
        txReceiptLoading,
        txReceiptError 
    } = GetTransactionStatus(registerData, skaleChainId);

    const handleCountryChange = (e) => {
        setSelectedCountry(e.target.value);
        setErrorMessage("");
    };

    const handleRcaidChange = (e) => {
        const value = e.target.value.toUpperCase();
        const regex = /^[A-Z0-9]{0,5}$/;
        if (regex.test(value)) {
            setCreativeCode(value);
            setErrorMessage("");
        }
    };

    const handleRegister = async () => {
        if (!isConnected) {
            setErrorMessage("Please connect your wallet first");
            return;
        }

        if (!hitmakrCreativesRegisterState.rcaIdStatus || 
            !selectedCountry || 
            creativeCode.length !== 5 || 
            fullCreativeID.length !== 7) {
            setErrorMessage("Please fill all fields correctly");
            return;
        }

        try {
            setErrorMessage("");
            await register(selectedCountry, creativeCode);
        } catch (error) {
            console.error("Registration error:", error);
            setErrorMessage(error.message || "Failed to register Creative ID");
        }
    };

    useEffect(() => {
        if (fullCreativeID !== hitmakrCreativesRegisterState.registerRcaId) {
            setHitmakrCreativesRegisterState((prevState) => ({
                ...prevState,
                registerRcaId: fullCreativeID,
            }));
        }

        const isValidLength = creativeCode.length === 5 && 
                            selectedCountry.length === 2 && 
                            fullCreativeID.length === 7;

        if (isValidLength && !isValidationLoading) {
            setHitmakrCreativesRegisterState((prevState) => ({
                ...prevState,
                rcaIdStatus: !isTaken
            }));
        } else {
            setHitmakrCreativesRegisterState((prevState) => ({
                ...prevState,
                rcaIdStatus: false,
            }));
        }
    }, [
        selectedCountry, 
        creativeCode, 
        isTaken, 
        isValidationLoading, 
        fullCreativeID,
        setHitmakrCreativesRegisterState
    ]);

    useEffect(() => {
        if (registerData) {
            setModalContent({
                title: "Transaction Submitted",
                description: "Please wait while your transaction is being confirmed...",
            });
            setShowModal(true);
        }
        
        if (txReceiptData?.status === "success") {
            setModalContent({
                title: "Success",
                description: "Creative ID registered successfully!",
            });
            setShowModal(true);
            setHitmakrCreativesRegisterState((prev) => ({
                ...prev,
                registeredRcaId: fullCreativeID,
            }));
        }
        
        if (txReceiptError || registerError) {
            setModalContent({
                title: "Error",
                description: "Failed to register Creative ID. Please try again.",
            });
            setShowModal(true);
        }
    }, [
        registerData, 
        txReceiptData, 
        txReceiptError,
        registerError,
        fullCreativeID, 
        setHitmakrCreativesRegisterState
    ]);

    const isComponentLoading = isValidationLoading;
    const isButtonLoading = isRegistering || networkSwitching || txReceiptLoading;
    
    const hasCreativeID = creativeIDInfo?.exists && creativeIDInfo?.id && creativeIDInfo.id !== "";

    if (!creativeIDInfo && creativeIdLoading) {
        return (
            <div className={styles.hitmakrRcaId}>
                <div className={styles.hitmakrRcaIdContainer}>
                    <div className={styles.hitmakrRcaIdHeader}>
                        <p>Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.hitmakrRcaId}>
            <div className={styles.hitmakrRcaIdContainer}>
                <div className={styles.hitmakrRcaIdHeader}>
                    <p>Creative Registry</p>
                </div>
                {!hasCreativeID ? (
                    <div className={styles.hitmakrRcaIdInputs}>
                        <div className={styles.creativeCcInput}>
                            <select 
                                value={selectedCountry} 
                                onChange={handleCountryChange}
                                disabled={isButtonLoading}
                            >
                                <option value="">Country Code</option>
                                {Object.entries(countryData).map(([code, name]) => (
                                    <option key={code} value={code}>
                                        {name} ({code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.creativeRcaInput}>
                            <div className={styles.creativeRcaInputContainer}>
                                <input
                                    placeholder="Unique Creative ID"
                                    value={creativeCode}
                                    onChange={handleRcaidChange}
                                    maxLength={5}
                                    disabled={isButtonLoading}
                                />
                                <div className={
                                    hitmakrCreativesRegisterState.rcaIdStatus 
                                        ? styles.creativeRcaInputStatusActive 
                                        : styles.creativeRcaInputStatus
                                }>
                                    <i className="fi fi-sr-check-circle"></i>
                                </div>
                            </div>
                        </div>
                        {errorMessage && (
                            <div className={styles.errorMessage}>
                                {errorMessage}
                            </div>
                        )}
                        <div className={styles.creativeMintButton}>
                            <HitmakrButton
                                buttonFunction={handleRegister}
                                isLoading={isButtonLoading}
                                buttonName={
                                    isRegistering
                                        ? "Registering..."
                                        : txReceiptLoading
                                            ? "Confirming..."
                                            : "Register"
                                }
                                buttonWidth="80%"
                                isDark={
                                    !hitmakrCreativesRegisterState.rcaIdStatus ||
                                    !selectedCountry ||
                                    creativeCode.length !== 5 ||
                                    !isConnected
                                }
                            />
                        </div>
                        {isButtonLoading && (
                            <div className={styles.subRegistryContainerFooter}>
                                <small>
                                    {isRegistering 
                                        ? "Please confirm the transaction in your wallet."
                                        : "Transaction in progress..."}
                                </small>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.hitmakrRcaIdData}>
                        <div className={styles.hitmakrRcaIdDataOption}>
                            <span>
                                <p>{creativeIDInfo.id.substring(0, 2)}</p>
                            </span>
                            <p>Country Code</p>
                        </div>
                        <div className={styles.hitmakrRcaIdDataOption}>
                            <span>
                                <p>{creativeIDInfo.id.substring(2)}</p>
                            </span>
                            <p>Registry Code</p>
                        </div>
                        <div className={styles.hitmakrRcaIdDataOption}>
                            <span>
                                <p>{creativeIDInfo.id}</p>
                            </span>
                            <p>Creative ID</p>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <HitmakrMiniModal
                    title={modalContent.title}
                    description={modalContent.description}
                    closeButton={<i className="fi fi-br-cross-small"></i>}
                    closeFunction={() => setShowModal(false)}
                    isAction={true}
                />
            )}
        </div>
    );
};

export default CreativeID;