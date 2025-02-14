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
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                priority={idx < 6}
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Genre;