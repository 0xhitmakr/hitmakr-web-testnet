"use client"

import { useParams } from "next/navigation"
import contentDatabase from "@/lib/metadata/ResourceData";
import styles from "./styles/Resource.module.css";

export default function ResourceName() {
    const params = useParams();
    const resourceName = params.resourcename;
    
    const content = contentDatabase.getContent(resourceName);

    if (!content) {
        return (
            <div className={styles.noContent}>
                <h1>Resource Not Found</h1>
                <p>The requested resource could not be found.</p>
            </div>
        );
    }

    const renderContent = (contentItem) => {
        switch (contentItem.type) {
            case 'introduction':
                return (
                    <div className={styles.dsrcItem} key={contentItem.heading}>
                        <div className={styles.dsrcContent}>
                            <div className={styles.detailsWrapper}>
                                <h1 className={styles.title}>{contentItem.heading}</h1>
                                <p className={styles.description}>{contentItem.text}</p>
                            </div>
                        </div>
                    </div>
                );

            case 'section':
                return (
                    <div className={styles.dsrcItem} key={contentItem.heading}>
                        <div className={styles.dsrcContent}>
                            <div className={styles.detailsWrapper}>
                                <h2 className={styles.title}>{contentItem.heading}</h2>
                                <p className={styles.description}>{contentItem.text}</p>
                                {contentItem.list && (
                                    <div className={styles.attributesWrapper}>
                                        <div className={styles.attributesRow}>
                                            {contentItem.list.map((item, index) => (
                                                <div key={index} className={styles.attributeCard}>
                                                    <span className={styles.attrValue}>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {contentItem.features && (
                                    <div className={styles.attributesWrapper}>
                                        <div className={styles.attributesRow}>
                                            {contentItem.features.map((feature, index) => (
                                                <div key={index} className={styles.attributeCard}>
                                                    <span className={styles.attrValue}>{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'features':
                return (
                    <div className={styles.dsrcItem} key={contentItem.heading}>
                        <div className={styles.dsrcContent}>
                            <div className={styles.detailsWrapper}>
                                <h2 className={styles.title}>{contentItem.heading}</h2>
                                <p className={styles.description}>{contentItem.text}</p>
                                {contentItem.list && (
                                    <div className={styles.earningsWrapper}>
                                        <div className={styles.earningsRow}>
                                            {contentItem.list.map((item, index) => (
                                                <div key={index} className={styles.earningCard}>
                                                    <span className={styles.label}>{item.title}</span>
                                                    <span className={styles.value}>{item.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.profileReleases}>
                <div className={styles.idContainer}>
                    <span className={styles.chainPill}>{content.category}</span>
                    <span className={styles.chainPillAddress}>Last updated: {new Date(content.lastUpdated).toLocaleDateString()}</span>
                </div>

                {content.content.map((contentItem, index) => (
                    renderContent(contentItem)
                ))}
                
                {content.category === 'Legal' && (
                    <div className={styles.dsrcMetadata}>
                        <div className={styles.dsrcMetadataLeft}>
                            <div className={styles.dsrcMetadataLeftOptions}>
                                <button className={styles.dsrcMetadataLeftOption}>
                                    <i className="fa-regular fa-bookmark"></i>
                                </button>
                                <button className={styles.dsrcMetadataLeftOption}>
                                    <i className="fa-regular fa-share-nodes"></i>
                                </button>
                            </div>
                        </div>
                        <div className={styles.dsrcMetadataRight}>
                            <button>Contact Legal Team</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}