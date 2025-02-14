import Image from "next/image";
import { useState, useEffect } from "react";
import CheckoutModal from "./checkout-modal";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";
import { useAccount } from "wagmi";
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useHasPurchased, useGetEditionConfig } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import { Edition } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";

const EditionCard = ({ type, description, price, mintType, isSelected, onClick, isEnabled }) => {
  const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
  
  const getCardClasses = () => {
    let baseClasses = `p-4 rounded-lg transition-all duration-300 ${!isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:ring-1 hover:ring-white/10'}`;
    
    if (isSelected) {
      baseClasses += ' ring-2 ring-white shadow-lg';
    }
    
    if (type === 'collector') {
      baseClasses += ' bg-gradient-to-r from-pink-600 via-purple-700 to-violet-800';
    } else if (type === 'license') {
      baseClasses += ' bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-800';
    } else {
      baseClasses += ' bg-gray-900/40';
    }
    
    return baseClasses;
  };

  return (
    <div
      className={getCardClasses()}
      role="button"
      onClick={isEnabled ? onClick : undefined}
    >
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-medium text-white mb-1">{formattedType}</h2>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-white">
              {price.price} {price.symbol}
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-400">{mintType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PurchaseCard = ({ data }) => {
  const [open, setOpen] = useState(null);
  const { address, isConnected } = useAccount();
  const [select, setSelect] = useState("streaming");
  const [editions, setEditions] = useState({
    streaming: { price: "0", symbol: "USDC", isEnabled: false },
    collector: { price: "0", symbol: "USDC", isEnabled: false },
    license: { price: "0", symbol: "USDC", isEnabled: false }
  });

  const { dsrcAddress } = useGetDSRC(data.dsrcid);
  const { hasPurchased } = useHasPurchased(dsrcAddress, isConnected ? address : null);
  const { config: streamingConfig } = useGetEditionConfig(dsrcAddress, Edition.Streaming);
  const { config: collectorsConfig } = useGetEditionConfig(dsrcAddress, Edition.Collectors);
  const { config: licensingConfig } = useGetEditionConfig(dsrcAddress, Edition.Licensing);

  const hasAnyEdition = isConnected && hasPurchased && 
    Object.values(hasPurchased).some(status => status === true);

  const allEditionsOwned = isConnected && hasPurchased && 
    Object.values(hasPurchased).every(status => status === true);

  useEffect(() => {
    if (dsrcAddress) {
      const newEditions = { ...editions };
      
      if (streamingConfig) {
        newEditions.streaming = {
          price: (parseFloat(streamingConfig.price) / 1e6).toFixed(2),
          symbol: "USDC",
          isEnabled: streamingConfig.isEnabled
        };
      }
      if (collectorsConfig) {
        newEditions.collector = {
          price: (parseFloat(collectorsConfig.price) / 1e6).toFixed(2),
          symbol: "USDC",
          isEnabled: collectorsConfig.isEnabled
        };
      }
      if (licensingConfig) {
        newEditions.license = {
          price: (parseFloat(licensingConfig.price) / 1e6).toFixed(2),
          symbol: "USDC",
          isEnabled: licensingConfig.isEnabled
        };
      }

      setEditions(newEditions);

      const firstEnabled = Object.entries(newEditions).find(([_, config]) => config.isEnabled);
      if (firstEnabled && !editions[select].isEnabled) {
        setSelect(firstEnabled[0]);
      }
    }
  }, [dsrcAddress, streamingConfig, collectorsConfig, licensingConfig]);

  return (
    <div className="p-4 max-w-md mx-auto bg-[#202020] rounded-[20px]">
      <header className="flex items-center gap-3 mb-6">
        <Image
          src={data.image}
          alt="Track artwork"
          width={48}
          height={48}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-xl font-medium text-white">{data.name}</h1>
          <div className="text-gray-400 text-sm flex items-center gap-1">
            by <GetUsernameByAddress address={data?.creator} />
          </div>
        </div>
      </header>

      <div className="space-y-3">
        <EditionCard
          type="streaming"
          description="Stream and enjoy this track with unlimited access"
          price={editions.streaming}
          mintType="∞ Available"
          isSelected={select === "streaming"}
          onClick={() => editions.streaming.isEnabled && setSelect("streaming")}
          isEnabled={editions.streaming.isEnabled}
        />

        <EditionCard
          type="collector"
          description="Own a unique piece of this track and support the artist"
          price={editions.collector}
          mintType="Limited Edition"
          isSelected={select === "collector"}
          onClick={() => editions.collector.isEnabled && setSelect("collector")}
          isEnabled={editions.collector.isEnabled}
        />

        <EditionCard
          type="license"
          description="Acquire full commercial rights to this track"
          price={editions.license}
          mintType="Exclusive"
          isSelected={select === "license"}
          onClick={() => editions.license.isEnabled && setSelect("license")}
          isEnabled={editions.license.isEnabled}
        />

        <button
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
            isConnected && !allEditionsOwned && editions[select].isEnabled
              ? 'bg-white text-black hover:bg-gray-100'
              : 'bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}
          onClick={() => setOpen({ ...data, type: select })}
          disabled={!isConnected || allEditionsOwned || !editions[select].isEnabled}
        >
          {!isConnected 
            ? "Connect Wallet" 
            : allEditionsOwned 
              ? "All Editions Owned" 
              : "Collect"
          }
        </button>
      </div>

      {open && (
        <CheckoutModal
          closeFunction={() => setOpen(null)}
          data={{ ...open, editionType: select }}
        />
      )}
    </div>
  );
};

export default PurchaseCard;