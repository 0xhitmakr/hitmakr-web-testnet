"use client"

import React, { useState } from "react";
import { useRecoilState } from "recoil";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { Minus, Plus } from "lucide-react";

const MIN_COLLECTOR_PRICE = 5;
const MIN_LICENSING_PRICE = 100;

const EditionPrices = () => {
    const [uploadState, setUploadState] = useRecoilState(
        HitmakrCreativesStore.CreativesUpload
    );
    const [errors, setErrors] = useState({
        collectors: "",
        licensing: ""
    });

    const validatePrice = (edition, value) => {
        const minPrice = edition === 'collectors' ? MIN_COLLECTOR_PRICE : MIN_LICENSING_PRICE;
        if (value < minPrice && uploadState.editions[edition].enabled) {
            return `Minimum price is ${minPrice} USDC`;
        }
        return "";
    };

    const handlePriceChange = (edition, e) => {
        const newValue = Math.max(0, parseInt(e.target.value, 10) || 0);
        const error = validatePrice(edition, newValue);
        
        setUploadState(prev => ({
            ...prev,
            editions: {
                ...prev.editions,
                [edition]: {
                    ...prev.editions[edition],
                    price: newValue,
                    enabled: newValue >= (edition === 'collectors' ? MIN_COLLECTOR_PRICE : MIN_LICENSING_PRICE)
                }
            }
        }));
        
        setErrors(prev => ({
            ...prev,
            [edition]: error
        }));
    };

    const incrementPrice = (edition) => {
        setUploadState(prev => {
            const newValue = prev.editions[edition].price + 1;
            const error = validatePrice(edition, newValue);
            
            setErrors(prevErrors => ({
                ...prevErrors,
                [edition]: error
            }));

            return {
                ...prev,
                editions: {
                    ...prev.editions,
                    [edition]: {
                        ...prev.editions[edition],
                        price: newValue,
                        enabled: newValue >= (edition === 'collectors' ? MIN_COLLECTOR_PRICE : MIN_LICENSING_PRICE)
                    }
                }
            };
        });
    };

    const decrementPrice = (edition) => {
        setUploadState(prev => {
            const newValue = Math.max(0, prev.editions[edition].price - 1);
            const error = validatePrice(edition, newValue);
            
            setErrors(prevErrors => ({
                ...prevErrors,
                [edition]: error
            }));

            return {
                ...prev,
                editions: {
                    ...prev.editions,
                    [edition]: {
                        ...prev.editions[edition],
                        price: newValue,
                        enabled: newValue >= (edition === 'collectors' ? MIN_COLLECTOR_PRICE : MIN_LICENSING_PRICE)
                    }
                }
            };
        });
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-white">Edition Prices in USDC</h2>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-white font-medium">Streaming Edition</div>
                        <div className="text-gray-400 text-sm">(Always Free)</div>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="number"
                            className="w-24 bg-zinc-800 text-white rounded-lg px-3 py-2 text-center"
                            value={0}
                            disabled
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-white font-medium">Collectors Edition</div>
                        <div className="text-gray-400 text-sm">Limited Edition NFT</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            className="w-24 bg-zinc-800 text-white rounded-lg px-3 py-2 text-center"
                            value={uploadState.editions.collectors.price}
                            onChange={(e) => handlePriceChange('collectors', e)}
                            min={MIN_COLLECTOR_PRICE}
                        />
                        <div className="flex space-x-1">
                            <button
                                onClick={() => decrementPrice('collectors')}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                            >
                                <Minus size={16} className="text-white" />
                            </button>
                            <button
                                onClick={() => incrementPrice('collectors')}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                            >
                                <Plus size={16} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
                {errors.collectors && (
                    <div className="text-red-500 text-sm mt-1">{errors.collectors}</div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-white font-medium">Licensing Edition</div>
                        <div className="text-gray-400 text-sm">Commercial Rights</div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            className="w-24 bg-zinc-800 text-white rounded-lg px-3 py-2 text-center"
                            value={uploadState.editions.licensing.price}
                            onChange={(e) => handlePriceChange('licensing', e)}
                            min={MIN_LICENSING_PRICE}
                        />
                        <div className="flex space-x-1">
                            <button
                                onClick={() => decrementPrice('licensing')}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                            >
                                <Minus size={16} className="text-white" />
                            </button>
                            <button
                                onClick={() => incrementPrice('licensing')}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                            >
                                <Plus size={16} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
                {errors.licensing && (
                    <div className="text-red-500 text-sm mt-1">{errors.licensing}</div>
                )}

                {!uploadState.editions.collectors.enabled && 
                 !uploadState.editions.licensing.enabled && (
                    <div className="text-amber-500 text-sm mt-4">
                        At least one paid edition must have a price greater than the minimum required
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditionPrices;