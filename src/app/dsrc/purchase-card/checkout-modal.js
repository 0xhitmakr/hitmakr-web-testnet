import { useState, useEffect } from "react";
import Image from "next/image";
import ReactDOM from "react-dom";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails, useHasPurchased } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import { Edition } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import { X, Check, Loader2 } from 'lucide-react';
import { useAccount } from "wagmi";
import { usePurchaseDSRC } from "@/app/config/hitmakrdsrc/hitmakrDSRCWagmi";

const CheckoutModal = ({ closeFunction, data }) => {
  const [select, setSelect] = useState(data.editionType || "streaming");
  const [purchaseError, setPurchaseError] = useState("");
  const [editions, setEditions] = useState({
    streaming: { price: "0", symbol: "USDC", isEnabled: false },
    collector: { price: "0", symbol: "USDC", isEnabled: false },
    license: { price: "0", symbol: "USDC", isEnabled: false }
  });

  const { address, isConnected } = useAccount();
  const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(data.dsrcid);
  const { details, loading: detailsLoading } = useGetDSRCDetails(dsrcAddress);
  const { hasPurchased, loading: purchaseCheckLoading, refetch: refetchPurchaseStatus } = useHasPurchased(
    dsrcAddress,
    isConnected ? address : null
  );
  const { purchase, loading: purchaseLoading, isCorrectChain } = usePurchaseDSRC(dsrcAddress);

  const isLoading = addressLoading || detailsLoading || (isConnected && purchaseCheckLoading);

  const allEditionsOwned = isConnected && hasPurchased && 
    Object.values(hasPurchased).every(status => status === true);

  const hasAnyEdition = isConnected && hasPurchased && 
    Object.values(hasPurchased).some(status => status === true);

  useEffect(() => {
    if (details?.editions) {
      const newEditions = {
        streaming: {
          price: (Number(details.editions.streaming.price) / 1e6).toFixed(2),
          symbol: "USDC",
          isEnabled: details.editions.streaming.isEnabled
        },
        collector: {
          price: (Number(details.editions.collectors.price) / 1e6).toFixed(2),
          symbol: "USDC",
          isEnabled: details.editions.collectors.isEnabled
        },
        license: {
          price: (Number(details.editions.licensing.price) / 1e6).toFixed(2),
          symbol: "USDC",
          isEnabled: details.editions.licensing.isEnabled
        }
      };
      setEditions(newEditions);
    }
  }, [details]);

  const handlePurchase = async () => {
    if (!isConnected) return;
    
    try {
      setPurchaseError("");
      const editionType = 
        select === 'streaming' ? Edition.Streaming :
        select === 'collector' ? Edition.Collectors :
        Edition.Licensing;

      await purchase(editionType);
      await refetchPurchaseStatus();
      closeFunction();
    } catch (error) {
      console.error('Purchase failed:', error);
      setPurchaseError(error.message || "Purchase failed. Please try again.");
    }
  };

  const selectedPrice = parseFloat(editions[select]?.price) || 0;
  const total = selectedPrice;

  const getEditionClasses = (editionId) => {
    let baseClasses = "p-3 rounded-lg transition-all duration-300 relative ";
    
    const isOwned = isConnected && hasPurchased?.[editionId === 'collector' ? 'collectors' : editionId];
    
    if (isOwned) {
      baseClasses += 'bg-green-900/20 cursor-default ';
    } else if (select === editionId) {
      if (editionId === 'collector') {
        baseClasses += 'bg-gradient-to-r from-pink-600 via-purple-700 to-violet-800 cursor-pointer ';
      } else if (editionId === 'license') {
        baseClasses += 'bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-800 cursor-pointer ';
      } else {
        baseClasses += 'bg-[#1a2333] cursor-pointer ';
      }
    } else {
      baseClasses += 'bg-[#1a2333]/60 hover:bg-[#1a2333] cursor-pointer ';
    }
    
    return baseClasses;
  };

  const getEditionPrice = (editionId) => {
    if (!details?.editions) return "0.00";
    
    const editionMap = {
      streaming: details.editions?.streaming,
      collector: details.editions?.collectors,
      license: details.editions?.licensing
    };

    const price = Number(editionMap[editionId]?.price || 0) / 1e6;
    return price.toFixed(2);
  };

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (allEditionsOwned) return "All Editions Owned";
    if (purchaseLoading) return "Processing...";
    if (!isCorrectChain) return "Switch Network";
    return "Checkout";
  };

  if (isLoading) {
    return null;
  }

  const modalContent = (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-[#151515] rounded-lg w-full max-w-sm">
        <div className="flex items-center justify-between p-3">
          <h2 className="text-lg font-medium text-white">Checkout</h2>
          <button 
            onClick={closeFunction}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-3 py-2 flex items-center gap-3">
          <Image
            src={data.image}
            alt="Track artwork"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h3 className="text-white text-sm font-medium">{data.name}</h3>
            <div className="text-gray-400 text-sm">
              <GetUsernameByAddress address={data?.creator} />
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {[
            { id: "streaming", label: "Streaming Edition" },
            { id: "collector", label: "Collectors Edition", configKey: 'collectors' },
            { id: "license", label: "Licensing Edition", configKey: 'licensing' }
          ].map((edition) => {
            const editionKey = edition.configKey || edition.id;
            const isEnabled = details?.editions?.[editionKey]?.isEnabled;
            if (!isEnabled) return null;

            const isOwned = isConnected && hasPurchased?.[editionKey];

            return (
              <div
                key={edition.id}
                className={getEditionClasses(edition.id)}
                role="button"
                onClick={() => !isOwned && setSelect(edition.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="text-white text-sm flex items-center gap-2">
                    {edition.label}
                    {isOwned && (
                      <Check size={14} className="text-green-400" />
                    )}
                  </div>
                  <div className="text-gray-300 text-sm">
                    {getEditionPrice(edition.id)} USDC
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">Total</span>
            <div className="text-right">
              <div className="text-white text-sm">
                {total.toFixed(2)} USDC
              </div>
            </div>
          </div>

          {purchaseError && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm">
              {purchaseError}
            </div>
          )}

          <button 
            onClick={handlePurchase}
            disabled={allEditionsOwned || purchaseLoading || !isConnected}
            className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              !isConnected
                ? 'bg-[#1a2333] text-white hover:bg-[#1a2333]/80'
                : allEditionsOwned
                  ? 'bg-green-900/20 text-gray-400 cursor-not-allowed'
                  : purchaseLoading
                    ? 'bg-[#1a2333]/50 text-gray-400 cursor-not-allowed'
                    : 'bg-[#1a2333] text-white hover:bg-[#1a2333]/80'
            }`}
          >
            {purchaseLoading && <Loader2 size={16} className="animate-spin" />}
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return ReactDOM.createPortal(modalContent, document.body);
};

export default CheckoutModal;