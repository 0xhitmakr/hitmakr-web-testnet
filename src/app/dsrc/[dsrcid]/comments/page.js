"use client"

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import styles from "./styles/DSRCComments.module.css";
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';
import HitmakrMiniModal from '@/app/components/modals/HitmakrMiniModal';
import { useParams } from 'next/navigation';
import GetUsernameByAddress from '@/app/helpers/profile/GetUsernameByAddress';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

const DSRCComments = () => {
    const params = useParams();
    const dsrcId = params.dsrcid;
    const { address, chainId } = useAccount();
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalComments, setTotalComments] = useState(0);
    const [modalState, setModalState] = useState({
        show: false,
        title: "",
        description: ""
    });
    

    useEffect(() => {
        if (dsrcId) {
            fetchComments(1, true);
        }
    }, [dsrcId]);

    const fetchComments = async (pageNum, reset = false) => {
        if (isLoading) return; // Prevent multiple simultaneous requests
        
        setIsLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/comment/dsrc/${dsrcId}/comments?page=${pageNum}&limit=10`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch comments');
            }

            const data = await response.json();
            
            if (reset) {
                setComments(data.comments);
            } else {
                setComments(prev => [...prev, ...data.comments]);
            }
            
            setTotalComments(data.pagination.totalComments);
            setHasMore(data.pagination.currentPage < data.pagination.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setModalState({
                show: true,
                title: "Error",
                description: "Failed to load comments"
            });
        } finally {
            setIsLoading(false);
        }
    };


    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!address) {
            setModalState({
                show: true,
                title: "Error",
                description: "Please connect your wallet to comment"
            });
            return;
        }
    
        if (!dsrcId) {
            setModalState({
                show: true,
                title: "Error",
                description: "DSRC ID is required"
            });
            return;
        }
    
        if (!comment.trim()) {
            setModalState({
                show: true,
                title: "Error",
                description: "Please enter a comment"
            });
            return;
        }
    
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            setModalState({
                show: true,
                title: "Error",
                description: "Authentication required"
            });
            return;
        }
    
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/comment/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'x-user-address': address,
                    'x-chain-id': chainId?.toString() || '1',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dsrcId: dsrcId,
                    content: comment.trim()
                })
            });
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to post comment');
            }
    
            setComment('');
            await fetchComments(1, true); // Refresh comments
            setModalState({
                show: true,
                title: "Success",
                description: "Comment posted successfully"
            });
        } catch (error) {
            console.error('Error posting comment:', error);
            setModalState({
                show: true,
                title: "Error",
                description: error.message || "Failed to post comment"
            });
        } finally {
            setIsSubmitting(false);
        }
    };



    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const loadMore = async () => {
        if (!isLoading && hasMore) {
            const nextPage = page + 1;
            await fetchComments(nextPage, false);
        }
    };

    return (
        <div className={styles.dsrcComments}>
            {modalState.show && (
                <HitmakrMiniModal
                    title={modalState.title}
                    description={modalState.description}
                    closeButton={<i className="fi fi-br-cross-small"></i>}
                    closeFunction={() => setModalState({
                        show: false,
                        title: "",
                        description: ""
                    })}
                    isAction={true}
                />
            )}

            <div className={styles.commentHeader}>
                <h3>Comments ({totalComments})</h3>
            </div>

            {address && (
                <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                    <div className={styles.inputWrapper}>
                        <textarea
                            value={comment}
                            onChange={(e) => {
                                if (e.target.value.length <= 500) {
                                    setComment(e.target.value);
                                }
                            }}
                            placeholder="Add a comment..."
                            maxLength={500}
                        />
                        <div className={styles.characterCount}>
                            {comment.length}/500
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSubmitting || !comment.trim()}
                        className={styles.submitButton}
                    >
                        {isSubmitting ? <LoaderWhiteSmall /> : 'Comment'}
                    </button>
                </form>
            )}

            <div className={styles.commentsList}>
                {comments.map((comment, index) => (
                    <div key={`${comment._id || index}`} className={styles.commentItem}>
                        <div className={styles.commentHeader}>
                            <span className={styles.userAddress}>
                                <GetUsernameByAddress address={comment.userAddress}/>
                            </span>
                            <span className={styles.commentDate}>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className={styles.commentContent}>{comment.content}</p>
                    </div>
                ))}

                {isLoading && (
                    <div className={styles.loading}>
                        <LoaderWhiteSmall />
                    </div>
                )}

                {!isLoading && hasMore && comments.length > 0 && (
                    <div className={styles.loadMore}>
                        <button 
                            onClick={loadMore} 
                            className={styles.loadMoreButton}
                            disabled={isLoading}
                        >
                            <i className="fi fi-sr-arrow-circle-down"></i>
                        </button>
                    </div>
                )}

                {!isLoading && !hasMore && comments.length > 0 && (
                    <p className={styles.noMore}>No more comments to load</p>
                )}

                {!isLoading && comments.length === 0 && (
                    <p className={styles.noComments}>No comments yet</p>
                )}
            </div>
        </div>
    );
};

export default DSRCComments;