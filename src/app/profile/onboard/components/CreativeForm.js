"use client"

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import styles from "../styles/Onboard.module.css";
import ArtistImage from "@/../public/images/creatives/artist.jpg"
import Image from 'next/image';
import OrganizationImage from "@/../public/images/creatives/organization.jpg";
import HitmakrButton from '@/app/components/buttons/HitmakrButton';
import RecordsImage from "@/../public/images/creatives/records.jpg";
import RouterPushLink from '@/app/helpers/RouterPushLink';
import HitmakrMiniModal from '@/app/components/modals/HitmakrMiniModal';
import { creativesLinks } from '@/lib/helpers/Links';
import { useIsVerifiedRPC } from '@/app/config/hitmakrverification/hitmakrVerificationRPC';
import '@flaticon/flaticon-uicons/css/all/all.css';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';

const artistFields = [
    { name: 'fullName', label: 'Full Legal Name', type: 'text', required: true, placeholder: 'Enter your full legal name' },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, placeholder: 'Enter your birth date' },
    { name: 'physicalAddress', label: 'Current Address', type: 'text', required: true, placeholder: 'Enter your current address' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: 'Enter your phone number' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter your email address' },
    { name: 'stageName', label: 'Stage Name or Pseudonym', type: 'text', placeholder: 'Enter your stage name or pseudonym' },
    { name: 'genres', label: 'Genre(s) of Music', type: 'text', required: true, placeholder: 'Enter your music genres' },
    { name: 'biography', label: 'Brief Artist Biography', type: 'textarea', placeholder: 'Write a brief biography' },
    { name: 'discography', label: 'Discography', type: 'textarea', placeholder: 'List your discography' },
    { name: 'upcomingProjects', label: 'Upcoming Releases or Projects', type: 'textarea', placeholder: 'Mention any upcoming projects' },
    { name: 'website', label: 'Official Website URL', type: 'url', placeholder: 'Enter your official website URL' },
    { name: 'isrcCodes', label: 'ISRC Codes for Released Tracks', type: 'textarea', placeholder: 'Provide ISRC codes for your tracks' },
    { name: 'musicLinks', label: 'Links to Released Music', type: 'textarea', required: true, placeholder: 'Share links to your released music' },
];

const orgFields = [
    { name: 'legalName', label: 'Legal Company Name', type: 'text', required: true, placeholder: 'Enter your company name' },
    { name: 'tradingName', label: 'Trading Name', type: 'text', placeholder: 'Enter the trading name' },
    { name: 'registrationNumber', label: 'Company Registration Number', type: 'text', required: true, placeholder: 'Enter the registration number' },
    { name: 'establishmentDate', label: 'Date of Establishment', type: 'date', required: true, placeholder: 'Enter the establishment date' },
    { name: 'registeredAddress', label: 'Registered Address', type: 'text', required: true, placeholder: 'Enter the registered address' },
    { name: 'operatingAddress', label: 'Operating Address', type: 'text', placeholder: 'Enter the operating address' },
    { name: 'website', label: 'Company Website', type: 'url', required: true, placeholder: 'Enter the company website' },
    { name: 'entityType', label: 'Type of Entity', type: 'text', required: true, placeholder: 'Specify the type of entity' },
    { name: 'country', label: 'Country of Registration', type: 'text', required: true, placeholder: 'Enter the country of registration' },
    { name: 'state', label: 'State/Province of Registration', type: 'text', placeholder: 'Enter the state/province of registration' },
    { name: 'owners', label: 'Names of Owners/Shareholders', type: 'textarea', required: true, placeholder: 'List the owners/shareholders' },
    { name: 'executives', label: 'Names and Titles of Key Executives', type: 'textarea', required: true, placeholder: 'List key executives and their titles' },
    { name: 'directors', label: 'Board of Directors', type: 'textarea', placeholder: 'List the board of directors' },
    { name: 'phone', label: 'Main Business Phone Number', type: 'tel', required: true, placeholder: 'Enter the business phone number' },
    { name: 'email', label: 'General Business Email', type: 'email', required: true, placeholder: 'Enter the business email' },
    { name: 'contactPerson', label: 'Designated Point of Contact', type: 'textarea', required: true, placeholder: 'Provide the point of contact details' },
    { name: 'signedArtists', label: 'List of Signed Artists', type: 'textarea', required: true, placeholder: 'List the signed artists' },
    { name: 'socialMedia', label: 'Official Social Media Accounts', type: 'textarea', required: true, placeholder: 'Provide official social media accounts' },
    { name: 'pressCoverage', label: 'Recent Press Releases or Media Coverage', type: 'textarea', placeholder: 'Mention any recent press coverage' },
    { name: 'isrcIssuerCode', label: 'ISRC Issuer Code', type: 'text', placeholder: 'Enter the ISRC issuer code' },
];

export default function CreativeForm() {
  const [formType, setFormType] = useState('artist');
  const [formData, setFormData] = useState({});
  const { address, chainId } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataAvailable, setIsDataAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { routeTo, isRouterLinkOpening } = RouterPushLink();
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '' });
  const [remainingMinutes, setRemainingMinutes] = useState(60);
  const { isVerified, loading: verificationLoading, error: verificationError } = useIsVerifiedRPC(address);



  useEffect(() => {
    const getCreativeData = async () => {
        setIsLoading(true);
        const data = await fetchCreativeData();
        if (data) {
            setFormData(data);
            setIsDataAvailable(true);
            setFormType(data.formType || 'artist');
        } else {
            setIsDataAvailable(false);
        }
        setIsLoading(false);
    };

    getCreativeData();
}, [address, chainId]);

  const fetchCreativeData = async () => {
    const token = localStorage.getItem('authToken');
    if (!token || !address || !chainId) {
        return null;
    }

    try {
        const response = await fetch('/api/creatives/onboard/details', {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'X-User-Address': address,
              'X-Chain-Id': chainId.toString(),
          },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch creative data');
        }

        return await response.json();
    } catch (error) {
        return null;
    }
  };

  const showModalAlert = (title, description) => {
    setModalContent({ title, description });
    setShowModal(true);
  };

  useEffect(() => {
    if (formData && formData.lastUpdated) {
      const updateRemainingMinutes = () => {
        const lastUpdated = new Date(formData.lastUpdated);
        const now = new Date();
        const diffInMinutes = Math.floor((now - lastUpdated) / (1000 * 60));
        const remaining = Math.max(60 - diffInMinutes, 0);
        setRemainingMinutes(remaining);
      };

      updateRemainingMinutes();
      const interval = setInterval(updateRemainingMinutes, 60000);
      return () => clearInterval(interval);
    }
  }, [formData.lastUpdated]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleFormTypeChange = (e) => {
    setFormType(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e) {
        e.preventDefault();
    }
    
    // Don't check for whitelist here since users need to submit first to get whitelisted
    if (isSubmitting) return;
    setIsSubmitting(true);

    const token = localStorage.getItem('authToken');
    if (!token || !address || !chainId) {
        showModalAlert('Authentication Error', 'Missing authentication data. Please connect your wallet and try again.');
        setIsSubmitting(false);
        return;
    }

    try {
        const response = await fetch('/api/creatives/onboard/details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-User-Address': address,
                'X-Chain-Id': chainId.toString(),
            },
            body: JSON.stringify({
                walletAddress: address,
                formType,
                ...formData
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to submit form');
        }

        // Update form data and states
        setFormData(prevData => ({
            ...prevData,
            ...result,
            lastUpdated: result.lastUpdated || new Date().toISOString()
        }));
        setIsEditing(false);
        setIsDataAvailable(true);

        // Show success message
        showModalAlert(
            'Success', 
            'Your creative profile has been submitted successfully! Our team will review your submission.'
        );
    } catch (error) {
        console.error('Form submission error:', error);
        showModalAlert('Error', `An error occurred while submitting the form: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
};

  const renderFields = (fields) => {
    const rows = [];

    for (let i = 0; i < fields.length; i += 2) {
        const field1 = fields[i];
        const field2 = fields[i + 1];

        const renderField = (field) => {
          if (field.type === 'textarea') {
            return (
              <div key={field.name} className={styles.formDetails}>
                <label htmlFor={field.name} className={styles.formDetailsLabel}>
                  {field.label}{field.required && '*'}
                </label>
                <textarea
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  onChange={handleInputChange}
                  required={field.required}
                  className={styles.formDetailsInput}
                  value={formData[field.name] || ''}
                />
              </div>
            );
          } else {
            return (
              <div className={styles.formDetails}>
                <label htmlFor={field.name} className={styles.formDetailsLabel}>
                  {field.label}{field.required && '*'}
                </label>
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  placeholder={field.placeholder}
                  onChange={handleInputChange}
                  required={field.required}
                  className={styles.formDetailsInput}
                  value={formData[field.name] || ''}
                />
              </div>
            );
          }
        };

        if (field1.type === 'textarea' || (field2 && field2.type === 'textarea')) {
          rows.push(
            <div key={field1.name} className={styles.formDetailsRow}>
              {renderField(field1)}
            </div>
          );
          if (field2) {
            rows.push(
              <div key={field2.name} className={styles.formDetailsRow}>
                {renderField(field2)}
              </div>
            );
          }
        } else {
          rows.push(
            <div key={field1.name + (field2 ? field2.name : '')} className={styles.formDetailsRow}>
              {renderField(field1)}
              {field2 && renderField(field2)}
            </div>
          );
        }
    }
    return rows;
  };

  const fields = formType === 'artist' ? artistFields : orgFields;
  
  if (isLoading || verificationLoading) {
    return (
      <div className={styles.onboardPage}>
        <div className={styles.onboardPageLoader}>
          <LoaderWhiteSmall />
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.hitmakrForm}>
      <div className={styles.hitmakrFormContainer}>
        {isDataAvailable ? (
          <>
            {isEditing ? (
              <>
                <div className={styles.creativeTypeSelect}>
                  <div
                    className={`${styles.creativeTypeSelectOption} ${formType === 'artist' ? styles.creativeTypeSelectOptionSelected : ''}`}
                    onClick={() => setFormType('artist')}
                  >
                    <span>Artist</span>
                    <span>
                      <Image src={ArtistImage} width={100} height={100} alt="Artist Creative" />
                    </span>
                  </div>
                  <div
                    className={`${styles.creativeTypeSelectOption} ${formType === 'organization' ? styles.creativeTypeSelectOptionSelected : ''}`}
                    onClick={() => setFormType('organization')}
                  >
                    <span>Organization</span>
                    <span>
                      <Image src={OrganizationImage} width={100} height={100} alt="Organization Creative" />
                    </span>
                  </div>
                </div>
                <form onSubmit={handleSubmit}>
                  {renderFields(fields)}
                  <div className={styles.submitButton}>
                    <HitmakrButton
                      buttonType="submit"
                      buttonWidth="30%"
                      buttonName="Update"
                      buttonFunction={handleSubmit}
                      isLoading={isSubmitting}
                    />
                  </div>
                </form>
              </>
            ) : (
              <div className={styles.formSubmitted}>
                <div className={styles.formSubmittedContainer}>
                  <Image src={RecordsImage} width={'100%'} height={'100%'} alt='Record label banner' unoptimized={true}/>
                  {!isVerified && (
                    <>
                      <p>
                        <b>Dear Valued Creator</b>,
                        <br></br>
                        <br></br>
                        Thank you for submitting your creative request to the HitMakr team! We are excited to review your submission and ensure it meets our high standards. Please rest assured that our team is diligently working behind the scenes to verify all the details. Our verification process is thorough and takes time to ensure the best quality.
                        <br></br>
                        <br></br>
                        During this period, we ask for your patience as we complete our review. We will notify you via email once your request has been approved and is ready to proceed. If there are any additional details or clarifications needed, we will reach out to you directly.
                        <br></br>
                        <br></br>
                        We understand that waiting can be challenging, but your request is important to us, and we want to ensure that everything is perfect. If you have any questions in the meantime, feel free to reach out to our support team.
                        <br></br>
                        <br></br>
                        We truly appreciate your trust in HitMakr and look forward to bringing your vision to life.
                        <br></br>
                        <br></br>
                        <br></br>
                        Warm regards, 
                        <br></br> 
                        The HitMakr Team
                      </p>
                      <div className={styles.formSubmittedButtons}>
                        <div className={styles.formSubmittedButtonLeft}>
                          <HitmakrButton
                            buttonType="button"
                            buttonWidth='80%'
                            buttonName={remainingMinutes > 0 ? `Edit in ${remainingMinutes}min` : 'Edit'}
                            buttonFunction={remainingMinutes > 0 ? ()=>{} : () => setIsEditing(true)}
                            isDark={true}
                            disabled={remainingMinutes > 0}
                          />
                        </div>
                        <div className={styles.formSubmittedButtonRight}>
                          <HitmakrButton 
                            buttonType="button" 
                            buttonWidth='80%' 
                            buttonName='Home'
                            buttonFunction={() => routeTo("/")}
                            isLoading={isRouterLinkOpening("/")}
                            isDark={false}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {isVerified && (
                    <>
                      <p>
                        <span>
                          <i className="fi fi-sr-shield-trust"></i>
                        </span>
                        <b>Congratulations!</b> 
                        <br></br> 
                        <br></br> 
                        We are delighted to inform you that your creative profile has been officially verified on the HitMakr platform! As a verified creator, you now have exclusive access to a range of exciting features designed to enhance your creative journey. 
                        <br></br> 
                        <br></br> 
                        You can now upload and share your audio content—whether it's music, sound effects, or podcasts—with our global community. Additionally, you'll have the unique opportunity to create your personal Creative ID, a critical element in our platform's on-chain system. 
                        <br></br> 
                        <br></br> 
                        Your Creative ID will serve as a vital identifier for all your uploads, and it will be used to generate a corresponding DSRC code on-chain, ensuring that each of your creations holds a distinct place within our ecosystem. 
                        <br></br> 
                        <br></br> 
                        We encourage you to get started right away by creating your Creative ID and uploading your first project. We're excited to witness the creativity and innovation you'll bring to HitMakr! 
                        <br></br> 
                        <br></br> 
                        <br></br> 
                        Best regards, 
                        <br></br> 
                        The HitMakr Team 
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.creativeTypeSelect}>
              <div
                className={`${styles.creativeTypeSelectOption} ${formType === 'artist' ? styles.creativeTypeSelectOptionSelected : ''}`}
                onClick={() => setFormType('artist')}
              >
                <span>Artist</span>
                <span>
                  <Image src={ArtistImage} width={100} height={100} alt="Artist Creative" />
                </span>
              </div>
              <div
                className={`${styles.creativeTypeSelectOption} ${formType === 'organization' ? styles.creativeTypeSelectOptionSelected : ''}`}
                onClick={() => setFormType('organization')}
              >
                <span>Organization</span>
                <span>
                  <Image src={OrganizationImage} width={100} height={100} alt="Organization Creative" />
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              {renderFields(fields)}
              <div className={styles.submitButton}>
                <HitmakrButton
                  buttonType="submit"
                  buttonWidth="30%"
                  buttonName="Submit"
                  buttonFunction={handleSubmit}
                  isLoading={isSubmitting}
                />
              </div>
            </form>
          </>
        )}
      </div>
      {showModal && (
        <HitmakrMiniModal
          title={modalContent.title}
          description={modalContent.description}
          closeButton={<i className="fi fi-br-cross-small"></i>}
          closeFunction={() => setShowModal(false)}
          learnMoreLink={creativesLinks.contact}
          isAction={true}
        />
      )}
    </div>
  );
}