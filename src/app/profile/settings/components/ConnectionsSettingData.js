import React, { useState } from 'react';
import { useCampAuth } from '@/app/config/camp/CampAuthProvider';
import { CampModal } from "@campnetwork/sdk/react";
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const ConnectionSettingData = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { linkedSocials, isLoadingSocials, refetchSocials } = useCampAuth();

  const handleModalClose = async () => {
    setIsModalOpen(false);
    await refetchSocials();
  };

  const socialIcons = [
    { name: 'twitter', icon: 'fi-brands-twitter-alt', isLinked: linkedSocials?.twitter },
    { name: 'discord', icon: 'fi-brands-discord', isLinked: linkedSocials?.discord },
    { name: 'spotify', icon: 'fi-brands-spotify', isLinked: linkedSocials?.spotify },
    { name: 'telegram', icon: 'fi fi-brands-telegram', isLinked: linkedSocials?.telegram },
    { name: 'tiktok', icon: 'fi-brands-tik-tok', isLinked: linkedSocials?.tiktok },
  ];

  const iconVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    hover: { 
      scale: 1.1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.95 
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-5 gap-4">
        {socialIcons.map((social, index) => (
          <motion.div
            key={social.name}
            className={`
              relative flex items-center justify-center p-4 rounded-lg cursor-pointer
              ${social.isLinked ? 'bg-zinc-800' : 'bg-zinc-900'}
              hover:bg-zinc-800 transition-colors duration-200
            `}
            variants={iconVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            onClick={() => setIsModalOpen(true)}
          >
            <i className={`${social.icon} text-2xl ${social.isLinked ? 'text-green-400' : 'text-zinc-400'}`} />
            {social.isLinked && (
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-green-400 rounded-full" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="p-6">
                <div className="mb-6 text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Connect Your Socials
                  </h3>
                  <p className="text-neutral-400 text-sm">
                    Connect your social accounts to enhance your profile and access exclusive features.
                  </p>
                </div>

                <div className="flex justify-center">
                  <CampModal onClose={handleModalClose} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectionSettingData;