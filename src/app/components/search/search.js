"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SearchIcon, X } from "lucide-react";
import styles from "./search.module.css";
import Image from "next/image";
import SearchSelect from "./select";
import LoaderWhiteSmall from "../animations/loaders/loaderWhiteSmall";
import debounce from "lodash.debounce";
import { useRouter } from "next/navigation";
import UserSearch from "./user-search";

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("title");
  const [results, setResults] = useState([]);
  const [defaultSong, setDefaultSong] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [userAddressOrName, setUserAddressOrName] = useState("");
  const containerRef = useRef();
  const router = useRouter();

  const formatSongData = (songs) =>
    songs.map((song) => ({
      id: song.dsrcId,
      title: song.metadata.name,
      imageUrl: song.metadata.image || "/placeholder.svg",
      description: song.description,
    }));

  const getLatestRelease = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: "1",
        limit: "5",
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/song/recent?${queryParams}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recent songs");
      }
      const data = await response.json();
      const formatData = formatSongData(data?.songs || []);
      setDefaultSong(formatData);
    } catch (error) {
      setDefaultSong([]);
    }
  }, []);

  useEffect(() => {
    getLatestRelease();
  }, [getLatestRelease]);

  const fetchSearchResults = async (pageToFetch, query, type) => {
    const queryParams = new URLSearchParams({
      page: pageToFetch.toString(),
      limit: "10",
    });

    if (query?.trim()) {
      queryParams.append("title", query.trim());
      queryParams.append("type", type.trim());
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/song/search?${queryParams}`
    );

    if (!response.ok) throw new Error("Failed to fetch results");

    return await response.json();
  };

  const fetchMore = useCallback(
    async (resetResults = false) => {
      try {
        setFetchLoading(true);
        const pageToFetch = resetResults ? 1 : currentPage;
        const data = await fetchSearchResults(pageToFetch, query, type);
        const newSongs = formatSongData(data?.songs || []);

        setResults((prev) =>
          resetResults ? newSongs : [...prev, ...newSongs]
        );
        setHasMore(pageToFetch < data.pagination.totalPages);
        setCurrentPage(resetResults ? 2 : pageToFetch + 1);
      } catch (error) {
        console.error("Error fetching more results:", error);
      } finally {
        setFetchLoading(false);
      }
    },
    [currentPage, query, type]
  );

  const handleSearchSong = useRef(
    debounce(
      async (
        value,
        setAllOptions,
        setMore,
        setCurr,
        setIsLoading,
        resetResults,
        type
      ) => {
        if (value.length > 1) {
          try {
            setIsLoading(true);
            const pageToFetch = resetResults ? 1 : currentPage;
            const data = await fetchSearchResults(pageToFetch, value, type);
            const newSongs = formatSongData(data?.songs || []);

            setAllOptions((prev) =>
              resetResults ? newSongs : [...prev, ...newSongs]
            );

            setMore(pageToFetch < data.pagination.totalPages);
            setCurr(resetResults ? 2 : pageToFetch + 1);
          } catch (error) {
          } finally {
            setIsLoading(false);
          }
        }
      },
      500
    )
  ).current;

  const handleSearchUser = useRef(
    debounce(async (value, setAllOptions) => {
      if (value.length > 1) {
        setAllOptions(value);
      }
    }, 500)
  ).current;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const onChangeHandler = (value) => {
    setQuery(value);
    if (type !== "user") {
      handleSearchSong(
        value,
        setResults,
        setHasMore,
        setCurrentPage,
        setIsLoading,
        true,
        type
      );
    } else {
      handleSearchUser(value, setUserAddressOrName);
    }
  };

  const songList = query.trim().length > 0 ? results : defaultSong;

  return (
    <div className={styles.container} ref={containerRef}>
      <SearchSelect onChange={(e) => setType(e)} value={type} />
      <div className={styles.searchWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search songs..."
          value={query}
          onChange={(e) => onChangeHandler(e.target.value)}
          onFocus={handleInputFocus}
        />
        {query || isOpen ? (
          <button onClick={handleClear} className={styles.closeButton}>
            <X size={20} />
          </button>
        ) : (
          <SearchIcon className={styles.searchIcon} size={20} />
        )}
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.heading}>
            {query
              ? `Search for "${query}"`
              : type === "user"
              ? "User/Artist"
              : "RELEASES"}
          </div>
          <div className={styles.resultsList}>
            {type === "user" ? (
              <UserSearch address={userAddressOrName} onClear={handleClear} />
            ) : (
              <>
                {isLoading ? (
                  <div
                    style={{
                      textAlign: "center",
                    }}
                  >
                    Loading...
                  </div>
                ) : songList.length > 0 ? (
                  songList.map((song) => (
                    <div
                      key={song.id}
                      className={styles.resultItem}
                      onClick={() => {
                        router.push(`/dsrc/${song.id}`);
                        handleClear();
                      }}
                    >
                      <Image
                        src={song.imageUrl}
                        alt={song.title}
                        className={styles.resultImage}
                        width={100}
                        height={100}
                      />
                      <div className={styles.resultInfo}>
                        <div className={styles.resultTitle}>{song.title}</div>
                        <div className={styles.resultArtist}>
                          {song.description}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center" }}>No results found</div>
                )}
              </>
            )}
          </div>

          {results.length > 0 && hasMore && (
            <div className={styles.loadMore}>
              <button
                onClick={() => fetchMore(false)}
                disabled={fetchLoading}
                className={styles.loadMoreButton}
              >
                {fetchLoading ? (
                  <LoaderWhiteSmall />
                ) : (
                  <i className="fi fi-sr-arrow-circle-down"></i>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
