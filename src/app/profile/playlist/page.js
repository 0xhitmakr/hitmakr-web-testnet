"use client"

import styles from "./styles/Playlist.module.css";
import React from "react";
import CreatePlaylist from "./components/CreatePlaylist";

export default function PlaylistPage() {
    return (
        <div className={styles.playlist}>
            <div className={styles.playlistHeader}>
                <p>Playlist</p>
            </div>
           
            
            <CreatePlaylist />

        </div>
    );
}