import GenreList from "./genre-list";
import Header from "../header/header";
import React from "react";
import { redirect } from "next/navigation";
import { musicGenres } from "@/lib/metadata/GenreData";

const GenreContent = ({ searchParams }) => {
  if (!searchParams.explore_type) {
    redirect("/explore");
  }

  const isExploreTypeRight =
    searchParams.explore_type.toLowerCase() === "genre";

  if (!isExploreTypeRight) {
    redirect("/explore");
  }

  if (searchParams?.explore_type?.toLowerCase() === "genre") {
    const isSoundsGenre = !!musicGenres.find(
      (item) => item.name.toLowerCase() === searchParams.genre.toLowerCase()
    );

    if (!isSoundsGenre) {
      redirect("/explore");
    }
  }

  return (
    <React.Fragment>
      <Header searchParams={searchParams} />
      <GenreList searchParams={searchParams} />
    </React.Fragment>
  );
};

export default GenreContent;
