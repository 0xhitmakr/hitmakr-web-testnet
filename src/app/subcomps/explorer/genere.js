"use client";

import React from "react";
import styles from "../styles/explorer.module.css";
import Image from "next/image";
import { GenreColor, musicGenres } from "@/lib/metadata/GenreData";
import useSetSearchParams from "@/app/explore/use-searchparams";

const Genre = () => {
  const setSearchParams = useSetSearchParams();

  return (
    <div className={styles.genreContainer}>
      <div className={styles.genreGrid}>
        {musicGenres.map((item, idx) => (
          <div
            className={styles.genreCard}
            key={item.name}
            style={{
              backgroundColor: GenreColor[idx],
            }}
            onClick={() =>
              setSearchParams({
                explore_type: "genre",
                genre: item.name.toLowerCase(),
              })
            }
          >
            <h3 className={styles.genreTitle}>{item.name}</h3>
            <div className={styles.imageWrapper}>
              <Image
                className={styles.genreImage}
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 300px, (max-width: 1200px) 250px, 200px" // Specify exact sizes
                loading={idx < 6 ? "eager" : "lazy"} // Load first 6 eagerly, lazy load rest
                placeholder="blur" // Add blur placeholder
                blurDataURL={`data:image/svg+xml;base64,${Buffer.from(
                  `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="${GenreColor[idx]}"/></svg>`
                ).toString('base64')}`}
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                unoptimized={true}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Genre;