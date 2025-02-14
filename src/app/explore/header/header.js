"use client";

import { ChevronDown } from "lucide-react";
import styles from "./header.module.css";
import { musicGenres } from "@/lib/metadata/GenreData";
import useSetSearchParams from "../use-searchparams";
import SearchableDropdown from "../dropdown/searchable-dropdown";

const capitalizeFirstLetter = (word) => {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
};

const Header = ({ searchParams }) => {
  const setSearchParams = useSetSearchParams();

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>{searchParams?.explore_type}</h1>
      <div className={styles.filterBar}>
        <SearchableDropdown
          country={searchParams?.location || ""}
          placeholder="Select a Country"
          onChange={(value) =>
            setSearchParams({
              explore_type: searchParams?.explore_type,
              genre: searchParams?.genre || "",
              total_price: searchParams?.total_price || "",
              location: value,
            })
          }
        />

        <div className={styles.combine}>
          

          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              defaultValue={capitalizeFirstLetter(searchParams?.genre) || ""}
              onChange={(e) =>
                setSearchParams({
                  explore_type: searchParams?.explore_type,
                  genre: e.target.value.toLowerCase(),
                  total_price: searchParams?.total_price || "",
                  location: searchParams?.location || "",
                })
              }
            >
              <option value={""}>Select a Genre</option>
              {musicGenres.map((genre) => (
                <option key={genre.name} value={genre.name}>
                  {genre.name}
                </option>
              ))}
            </select>
            <ChevronDown className={styles.chevron} />
          </div>

          

          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              defaultValue={searchParams?.total_price || ""}
              onChange={(e) =>
                setSearchParams({
                  explore_type: searchParams?.explore_type,
                  genre: searchParams?.genre || "",
                  total_price: searchParams?.total_price || "",
                  location: searchParams?.location || "",
                  date: e.target.value,
                  likes: searchParams?.likes || "",
                })
              }
            >
              <option value="">Select a option</option>
              <option value="dsc">Date (New to Old)</option>
              <option value="asc">Date (Old to New)</option>
            </select>
            <ChevronDown className={styles.chevron} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
